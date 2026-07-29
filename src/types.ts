/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type OilCategory = 'crude' | 'diesel' | 'gasoline' | 'lube' | 'asphalt' | 'aviation' | 'kerosene';

export type ReferenceTemperature = 15 | 20 | 60;

export type VolumeUnit = 'm3' | 'L' | 'bbl' | 'gal' | 'uk_gal' | 'kg' | 't' | 'lb';

export type AsphaltMethod = 'astm_d4311' | 'linear' | 'gbt1885_54b';

export type DensityMode = 'g' | 'kg' | 'sg' | 'api';

export interface CalculationInput {
  category: OilCategory;
  obsTemp: number;         // Observed Temperature for Density in Celsius (°C) or °F for asphalt 60°F
  obsDensity: number;      // Base Density in g/cm³
  refTemp: ReferenceTemperature; // Reference Temperature (15 °C, 20 °C, or 60 °F)
  volume: number;          // Observed Volume
  volumeUnit: VolumeUnit;  // 'm3' or 'L' etc.
  densityMode?: DensityMode; // Selected density/gravity unit mode
  asphaltMethod?: AsphaltMethod; // Asphalt calculation method (default 'astm_d4311')
  asphaltGamma?: number;   // Kept for backward compatibility
  volTemp?: number;        // Temperature for measured volume (°C or °F)
  enableSteelExpansion?: boolean; // Whether to calculate steel thermal expansion (钢热膨胀修正)
}

export interface CalculationResult {
  standardDensityKg: number; // kg/m³
  standardDensityG: number;  // g/cm³
  vcf: number;               // Oil Volume Correction Factor (VCF) based on volume temp
  steelExpansionFactor: number; // Steel thermal expansion factor f_st
  totalVcf: number;          // Combined VCF = vcf * steelExpansionFactor
  standardVolumeM3: number;  // Standard Volume in m³
  standardVolumeL: number;   // Standard Volume in L
  barrels: number;           // Barrels (bbl)
  usGallons: number;         // US Gallons
  ukGallons: number;         // UK (Imperial) Gallons
  apiGravity: number;        // API Gravity
  standardWeightKg?: number; // Standard Weight in kg (Vacuum)
  standardWeightTon?: number; // Standard Weight in metric tons (t) (Vacuum)
  standardWeightLb?: number; // Standard Weight in pounds (lb) (Vacuum)
  airWeightKg?: number;      // Apparent mass in air in kg
  airWeightTon?: number;     // Apparent mass in air in metric tons (t)
  airWeightLb?: number;      // Apparent mass in air in pounds (lb)
}

export interface HistoryRecord {
  id: string;
  timestamp: number;
  input: CalculationInput;
  result: CalculationResult;
}
