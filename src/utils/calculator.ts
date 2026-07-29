/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CalculationInput, CalculationResult, OilCategory } from '../types';

/**
 * Gets acceptable density range in g/cm³ for a given oil category.
 * Used for validation and UX hints.
 */
export function getDensityRange(category: OilCategory): { min: number; max: number; recommendMin: number; recommendMax: number } {
  switch (category) {
    case 'gasoline':
      return { min: 0.5000, max: 0.8500, recommendMin: 0.6800, recommendMax: 0.7900 };
    case 'diesel':
      return { min: 0.7000, max: 0.9500, recommendMin: 0.8000, recommendMax: 0.8800 };
    case 'crude':
      return { min: 0.6100, max: 1.0800, recommendMin: 0.7500, recommendMax: 0.9600 };
    case 'lube':
      return { min: 0.7500, max: 1.1800, recommendMin: 0.8200, recommendMax: 0.9200 };
    case 'asphalt':
      return { min: 0.8500, max: 1.2500, recommendMin: 0.9500, recommendMax: 1.0600 };
    case 'aviation':
      return { min: 0.7000, max: 0.8800, recommendMin: 0.7750, recommendMax: 0.8400 };
    case 'kerosene':
      return { min: 0.7200, max: 0.8900, recommendMin: 0.7800, recommendMax: 0.8350 };
  }
}

/**
 * Solves the ASTM D1250 standard density at 15°C (in kg/m³) given observed density and temperature.
 * 
 * Formula:
 *   obsDensity = stdDensity15 * exp(-alpha * dT * (1 + 0.8 * alpha * dT))
 *   dT = obsTemp - 15
 *   alpha = K0 / (stdDensity15^2) + K1 / stdDensity15
 */
export function solveStandardDensity15(
  obsDensityKg: number,
  obsTempC: number,
  category: OilCategory,
  asphaltMethod?: string,
  asphaltGamma?: number
): { stdDensity15: number; vcf15: number } {
  // If Asphalt: 取消视密换标密，沥青输入密度即为基准/标准密度，并应用 ASTM D4311-04 或指定方法计算 VCF
  if (category === 'asphalt') {
    const stdDensity15 = obsDensityKg;
    const method = asphaltMethod ?? 'astm_d4311';
    const T = obsTempC;
    let vcf15 = 1;

    if (method === 'astm_d4311') {
      // ASTM D4311-04 Standard Practice:
      // Column A: 15°C density >= 966 kg/m³
      // Column B: 15°C density between 850 and 965 kg/m³
      const isColumnA = stdDensity15 >= 966;
      if (isColumnA) {
        vcf15 = 1.0094684142 - 6.33413410744e-4 * T + 1.45710416212e-7 * T * T;
      } else {
        vcf15 = 1.0108020095 - 7.2343515319e-4 * T + 2.1996598346e-7 * T * T;
      }
    } else if (method === 'linear') {
      const gammaG = asphaltGamma ?? 0.00064;
      const gammaKg = gammaG * 1000; // e.g. 0.64 kg/m³/°C
      const dT = T - 15;
      const obsTempDensity = stdDensity15 - gammaKg * dT;
      vcf15 = stdDensity15 > 0 ? obsTempDensity / stdDensity15 : 1;
    } else {
      // gbt1885_54b
      const K0 = 103.8720;
      const K1 = 0.7019;
      const dT = T - 15;
      const alpha = K0 / (stdDensity15 * stdDensity15) + K1 / stdDensity15;
      vcf15 = Math.exp(-alpha * dT * (1 + 0.8 * alpha * dT));
    }

    return { stdDensity15, vcf15 };
  }

  // Get ASTM D1250-80 Table 54B K0 & K1 coefficients
  let K0 = 0;
  let K1 = 0;

  switch (category) {
    case 'crude': // Group A
      K0 = 613.9723;
      K1 = 0.0;
      break;
    case 'gasoline': // Group B: Gasoline-like products
      K0 = 346.7008;
      K1 = 0.4388;
      break;
    case 'diesel': // Group B: Diesel / Fuel oils / Transition oils
    case 'aviation': // Jet Fuel / Aviation turbine fuel uses Group B mid-distillates
    case 'kerosene': // Kerosene uses Group B mid-distillates
      K0 = 103.8720;
      K1 = 0.7019;
      break;
    case 'lube': // Group D
      K0 = 0.0;
      K1 = 0.6278;
      break;
    default:
      K0 = 103.8720;
      K1 = 0.7019;
      break;
  }

  const dT = obsTempC - 15;

  // Use Bisection Method to find standard density at 15°C
  let low = obsDensityKg - 250;
  let high = obsDensityKg + 250;
  if (low < 400) low = 400;
  if (high > 1300) high = 1300;

  let bestStdDensity = obsDensityKg;
  let maxIterations = 80;

  for (let i = 0; i < maxIterations; i++) {
    const mid = (low + high) / 2;
    const alpha = K0 / (mid * mid) + K1 / mid;
    const vcf = Math.exp(-alpha * dT * (1 + 0.8 * alpha * dT));
    const calculatedObsDensity = mid * vcf;

    if (Math.abs(calculatedObsDensity - obsDensityKg) < 1e-8) {
      bestStdDensity = mid;
      break;
    }

    // Since calculatedObsDensity is monotonically increasing with mid
    if (calculatedObsDensity > obsDensityKg) {
      high = mid;
    } else {
      low = mid;
    }
    bestStdDensity = mid;
  }

  const alphaExact = K0 / (bestStdDensity * bestStdDensity) + K1 / bestStdDensity;
  const vcf15 = Math.exp(-alphaExact * dT * (1 + 0.8 * alphaExact * dT));

  return { stdDensity15: bestStdDensity, vcf15 };
}

/**
 * Calculates all conversion metrics for standard density, VCF, steel expansion, and volume
 */
export function calculateOilMetrics(input: CalculationInput): CalculationResult {
  const obsDensityKg = input.obsDensity * 1000;
  const category = input.category;
  const refTemp = input.refTemp;

  // 1. Normalize Density Observed Temperature (密度测定温度)
  let obsTempC: number;
  let obsTempF: number;

  if (category === 'asphalt' && refTemp === 60) {
    obsTempF = input.obsTemp;
    obsTempC = (obsTempF - 32) / 1.8;
  } else {
    obsTempC = input.obsTemp;
    obsTempF = obsTempC * 1.8 + 32;
  }

  // 2. Normalize Volume Measured Temperature (体积实测温度 / 计量油温)
  // Default to density observed temperature if not specified
  const rawVolTemp = input.volTemp !== undefined ? input.volTemp : input.obsTemp;
  let volTempC: number;
  let volTempF: number;

  if (category === 'asphalt' && refTemp === 60) {
    volTempF = rawVolTemp;
    volTempC = (volTempF - 32) / 1.8;
  } else {
    volTempC = rawVolTemp;
    volTempF = volTempC * 1.8 + 32;
  }

  // 3. Solve for standard density at 15°C (using density observed temperature)
  const { stdDensity15 } = solveStandardDensity15(
    obsDensityKg, 
    obsTempC, 
    category, 
    input.asphaltMethod, 
    input.asphaltGamma
  );

  let targetStdDensityKg = stdDensity15;
  let targetVcf = 1.0; // Oil Volume Correction Factor (VCF) based on volTemp

  // Get coefficient category parameters
  let K0 = 0;
  let K1 = 0;
  switch (category) {
    case 'crude':
      K0 = 613.9723;
      K1 = 0.0;
      break;
    case 'gasoline':
      K0 = 346.7008;
      K1 = 0.4388;
      break;
    case 'diesel':
    case 'aviation':
    case 'kerosene':
      K0 = 103.8720;
      K1 = 0.7019;
      break;
    case 'lube':
      K0 = 0.0;
      K1 = 0.6278;
      break;
    default:
      K0 = 103.8720;
      K1 = 0.7019;
      break;
  }

  // 4. Calculate Oil VCF based on Volume Measured Temperature (volTemp)
  if (refTemp === 60) {
    if (category === 'asphalt') {
      targetStdDensityKg = obsDensityKg;
      const TF = volTempF;
      const isColumnA = targetStdDensityKg >= 966;
      if (isColumnA) {
        targetVcf = 1.0211326242 - 3.548988118e-4 * TF + 4.49881e-8 * TF * TF;
      } else {
        targetVcf = 1.02413769 - 4.0641418e-4 * TF + 6.79176e-8 * TF * TF;
      }
    } else {
      // General Oil ASTM D1250 60°F Base
      const dTF = volTempF - 60;
      const sg60 = stdDensity15 / 999.012;
      const alpha60 = K0 / (sg60 * sg60 * 999.012 * 999.012) + K1 / (sg60 * 999.012);
      targetVcf = Math.exp(-alpha60 * dTF * (1 + 0.8 * alpha60 * dTF));
      targetStdDensityKg = stdDensity15;
    }
  } else if (refTemp === 20) {
    if (category === 'asphalt') {
      const method = input.asphaltMethod ?? 'astm_d4311';
      targetStdDensityKg = obsDensityKg;

      if (method === 'astm_d4311') {
        const isColumnA = targetStdDensityKg >= 966;
        const T = volTempC;
        let vcfT = 1;
        let vcf20 = 1;
        if (isColumnA) {
          vcfT = 1.0094684142 - 6.33413410744e-4 * T + 1.45710416212e-7 * T * T;
          vcf20 = 1.0094684142 - 6.33413410744e-4 * 20 + 1.45710416212e-7 * 400;
        } else {
          vcfT = 1.0108020095 - 7.2343515319e-4 * T + 2.1996598346e-7 * T * T;
          vcf20 = 1.0108020095 - 7.2343515319e-4 * 20 + 2.1996598346e-7 * 400;
        }
        targetVcf = vcf20 > 0 ? vcfT / vcf20 : vcfT;
      } else if (method === 'linear') {
        const gammaG = input.asphaltGamma ?? 0.00064;
        const gammaKg = gammaG * 1000;
        const dT20 = volTempC - 20;
        const volTempDensity = targetStdDensityKg - gammaKg * dT20;
        targetVcf = targetStdDensityKg > 0 ? volTempDensity / targetStdDensityKg : 1;
      } else {
        const alpha20 = K0 / (targetStdDensityKg * targetStdDensityKg) + K1 / targetStdDensityKg;
        const dT20 = volTempC - 20;
        targetVcf = Math.exp(-alpha20 * dT20 * (1 + 0.8 * alpha20 * dT20));
      }
    } else {
      // Find density at 20°C from density at 15°C
      const alpha15 = K0 / (stdDensity15 * stdDensity15) + K1 / stdDensity15;
      const dT_15_to_20 = 5; // 20 - 15
      const vcf_15_to_20 = Math.exp(-alpha15 * dT_15_to_20 * (1 + 0.8 * alpha15 * dT_15_to_20));
      const stdDensity20 = stdDensity15 * vcf_15_to_20;
      targetStdDensityKg = stdDensity20;

      // Calculate VCF at 20°C for volume temperature volTempC
      const alpha20 = K0 / (stdDensity20 * stdDensity20) + K1 / stdDensity20;
      const dT_vol_20 = volTempC - 20;
      targetVcf = Math.exp(-alpha20 * dT_vol_20 * (1 + 0.8 * alpha20 * dT_vol_20));
    }
  } else {
    // refTemp === 15°C
    if (category === 'asphalt') {
      const method = input.asphaltMethod ?? 'astm_d4311';
      targetStdDensityKg = obsDensityKg;
      const T = volTempC;

      if (method === 'astm_d4311') {
        const isColumnA = targetStdDensityKg >= 966;
        if (isColumnA) {
          targetVcf = 1.0094684142 - 6.33413410744e-4 * T + 1.45710416212e-7 * T * T;
        } else {
          targetVcf = 1.0108020095 - 7.2343515319e-4 * T + 2.1996598346e-7 * T * T;
        }
      } else if (method === 'linear') {
        const gammaG = input.asphaltGamma ?? 0.00064;
        const gammaKg = gammaG * 1000;
        const dT15 = volTempC - 15;
        const volTempDensity = targetStdDensityKg - gammaKg * dT15;
        targetVcf = targetStdDensityKg > 0 ? volTempDensity / targetStdDensityKg : 1;
      } else {
        const alpha15 = K0 / (targetStdDensityKg * targetStdDensityKg) + K1 / targetStdDensityKg;
        const dT15 = volTempC - 15;
        targetVcf = Math.exp(-alpha15 * dT15 * (1 + 0.8 * alpha15 * dT15));
      }
    } else {
      // General oil at 15°C base
      const alpha15 = K0 / (stdDensity15 * stdDensity15) + K1 / stdDensity15;
      const dT15 = volTempC - 15;
      targetVcf = Math.exp(-alpha15 * dT15 * (1 + 0.8 * alpha15 * dT15));
      targetStdDensityKg = stdDensity15;
    }
  }

  // 5. Steel Thermal Expansion Calculation (容器钢热膨胀系数 f_st)
  // Standard steel cubic thermal expansion coefficient = 3.6e-5 / °C (1.2e-5 * 3)
  // Reference base temperature T0 (°C)
  let baseTempC = 20;
  if (refTemp === 15) baseTempC = 15;
  if (refTemp === 60) baseTempC = (60 - 32) / 1.8; // ~15.556 °C

  let steelExpansionFactor = 1.0;
  if (input.enableSteelExpansion) {
    steelExpansionFactor = 1.0 + 0.000036 * (volTempC - baseTempC);
  }

  // Combined VCF (Total Correction Factor) = Oil VCF * Steel Expansion Factor
  const totalVcf = targetVcf * steelExpansionFactor;

  // 6. Calculate Volumes
  const inputVolume = input.volume;
  const inputUnit = input.volumeUnit;

  let volumeInL = 0;

  if (inputUnit === 'm3') {
    volumeInL = inputVolume * 1000;
  } else if (inputUnit === 'L') {
    volumeInL = inputVolume;
  } else if (inputUnit === 'bbl') {
    volumeInL = inputVolume * 158.987294928;
  } else if (inputUnit === 'gal') {
    volumeInL = inputVolume * 3.785411784;
  } else if (inputUnit === 'uk_gal') {
    volumeInL = inputVolume * 4.54609;
  } else {
    // Weight units to observed volume
    const obsDensityKgL = input.obsDensity; // g/cm3 equivalent to kg/L
    let weightInKg = 0;
    if (inputUnit === 'kg') {
      weightInKg = inputVolume;
    } else if (inputUnit === 't') {
      weightInKg = inputVolume * 1000;
    } else if (inputUnit === 'lb') {
      weightInKg = inputVolume * 0.45359237;
    }
    volumeInL = obsDensityKgL > 0 ? (weightInKg / obsDensityKgL) : 0;
  }

  const volumeInM3 = volumeInL / 1000;

  // Standard volume = Observed Volume * Total VCF
  const standardVolumeM3 = volumeInM3 * totalVcf;
  const standardVolumeL = volumeInL * totalVcf;

  // Convert Standard Volume to Barrels, US Gallons, UK Gallons
  const barrels = standardVolumeM3 * 6.289811;
  const usGallons = standardVolumeM3 * 264.172052;
  const ukGallons = standardVolumeM3 * 219.969248;

  // Standard weight calculation in Vacuum:
  const standardWeightKg = standardVolumeL * (targetStdDensityKg / 1000);
  const standardWeightTon = standardWeightKg / 1000;
  const standardWeightLb = standardWeightKg / 0.45359237;

  // Weight in Air with Air Buoyancy Correction:
  const airDensityKg = Math.max(0, targetStdDensityKg - 1.1);
  const airWeightKg = standardVolumeM3 * airDensityKg;
  const airWeightTon = airWeightKg / 1000;
  const airWeightLb = airWeightKg / 0.45359237;

  // API Gravity is based strictly on the standard density at 15°C
  const sg = stdDensity15 / 999.012;
  const apiGravity = (141.5 / sg) - 131.5;

  return {
    standardDensityKg: targetStdDensityKg,
    standardDensityG: targetStdDensityKg / 1000,
    vcf: targetVcf,
    steelExpansionFactor,
    totalVcf,
    standardVolumeM3,
    standardVolumeL,
    barrels,
    usGallons,
    ukGallons,
    apiGravity,
    standardWeightKg,
    standardWeightTon,
    standardWeightLb,
    airWeightKg,
    airWeightTon,
    airWeightLb,
  };
}

/**
 * Gets printable label for an oil category
 */
export function getCategoryLabel(category: OilCategory): string {
  switch (category) {
    case 'crude':
      return '原油 (Crude)';
    case 'diesel':
      return '柴油 (Diesel)';
    case 'gasoline':
      return '汽油 (Gasoline)';
    case 'lube':
      return '润滑油 (Lubricating Oil)';
    case 'asphalt':
      return '沥青 (Asphalt)';
    case 'aviation':
      return '航空燃料 (Jet Fuel)';
    case 'kerosene':
      return '煤油 (Kerosene)';
  }
}

/**
 * Gets specific ASTM / GB standard Table name dynamically based on category and reference temperature
 */
export function getVcfStandardLabel(
  category: OilCategory, 
  refTemp: number, 
  asphaltMethod?: string, 
  asphaltGamma?: number
): string {
  if (category === 'asphalt') {
    if (refTemp === 15) return 'ASTM D4311-04 (表1 - 15°C)';
    if (refTemp === 60) return 'ASTM D4311-04 (表2 - 60°F)';
    return 'ASTM D4311-04 (20°C基准)';
  }
  
  if (refTemp === 15) {
    switch (category) {
      case 'crude':
        return 'ASTM Table 54A';
      case 'lube':
        return 'ASTM Table 54D';
      default:
        return 'ASTM Table 54B';
    }
  } else if (refTemp === 60) {
    switch (category) {
      case 'crude':
        return 'ASTM Table 6A';
      case 'lube':
        return 'ASTM Table 6D';
      default:
        return 'ASTM Table 6B';
    }
  } else {
    // refTemp === 20
    switch (category) {
      case 'crude':
        return 'GB/T 1885 Table 24A';
      case 'lube':
        return 'GB/T 1885 Table 24D';
      default:
        return 'GB/T 1885 Table 24B';
    }
  }
}

