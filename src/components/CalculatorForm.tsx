/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { OilCategory, ReferenceTemperature, VolumeUnit, CalculationInput, CalculationResult, AsphaltMethod, DensityMode } from '../types';
import { getDensityRange, getCategoryLabel, calculateOilMetrics, getVcfStandardLabel } from '../utils/calculator';
import VisualExpansionModel from './VisualExpansionModel';
import { 
  Dribbble, Flame, Thermometer, Database, HelpCircle, 
  ChevronRight, Save, Scale, ArrowRight, Table2, Info, Compass,
  Sliders, Layers
} from 'lucide-react';

interface CalculatorFormProps {
  onSaveToHistory: (input: CalculationInput, result: CalculationResult) => void;
  initialInput?: CalculationInput;
}

export default function CalculatorForm({ onSaveToHistory, initialInput }: CalculatorFormProps) {
  // 1. Inputs State
  const [category, setCategory] = useState<OilCategory>('diesel');
  const [obsTemp, setObsTemp] = useState<string>('20.0'); // Density measured temperature (视密温度)
  const [volTemp, setVolTemp] = useState<string>('20.0'); // Volume measured temperature (实测油温)
  const [isVolTempCustom, setIsVolTempCustom] = useState<boolean>(false); // Whether volTemp is customized
  const [enableSteelExpansion, setEnableSteelExpansion] = useState<boolean>(false); // Steel thermal expansion toggle
  const [obsDensity, setObsDensity] = useState<string>('0.8350');
  const [densityMode, setDensityMode] = useState<DensityMode>('g'); // 'g' | 'kg' | 'sg' | 'api'
  const [refTemp, setRefTemp] = useState<ReferenceTemperature>(20);
  const [volume, setVolume] = useState<string>('100.0');
  const [volumeUnit, setVolumeUnit] = useState<VolumeUnit>('m3');
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');

  // Load from initialInput if custom reloaded from history
  useEffect(() => {
    if (initialInput) {
      setCategory(initialInput.category);
      setObsTemp(initialInput.obsTemp.toString());
      if (initialInput.volTemp !== undefined) {
        setVolTemp(initialInput.volTemp.toString());
        setIsVolTempCustom(initialInput.volTemp !== initialInput.obsTemp);
      } else {
        setVolTemp(initialInput.obsTemp.toString());
        setIsVolTempCustom(false);
      }
      if (initialInput.enableSteelExpansion !== undefined) {
        setEnableSteelExpansion(initialInput.enableSteelExpansion);
      }
      setObsDensity(initialInput.obsDensity.toString());
      setRefTemp(initialInput.refTemp);
      setVolume(initialInput.volume.toString());
      setVolumeUnit(initialInput.volumeUnit);
      if (initialInput.densityMode) setDensityMode(initialInput.densityMode);
      
      const imperialUnits = ['bbl', 'gal', 'uk_gal', 'lb'];
      if (imperialUnits.includes(initialInput.volumeUnit)) {
        setUnitSystem('imperial');
      } else {
        setUnitSystem('metric');
      }
    }
  }, [initialInput]);

  // Handle density observed temperature change
  const handleObsTempChange = (val: string) => {
    setObsTemp(val);
    if (!isVolTempCustom) {
      setVolTemp(val);
    }
  };

  // Sync volume temperature with density temperature
  const handleSyncVolTemp = () => {
    setVolTemp(obsTemp);
    setIsVolTempCustom(false);
  };

  // Handle Reference Temperature Change with automatic unit/temperature conversion for asphalt
  const handleRefTempChange = (newRef: ReferenceTemperature) => {
    if (newRef === refTemp) return;

    if (category === 'asphalt') {
      const currentVal = parseFloat(obsTemp);
      if (!isNaN(currentVal)) {
        if (newRef === 60 && refTemp !== 60) {
          // Switching asphalt from Celsius to 60°F
          if (currentVal <= 250) {
            setObsTemp((currentVal * 1.8 + 32).toFixed(1));
          }
        } else if (refTemp === 60 && newRef !== 60) {
          // Switching asphalt from 60°F to Celsius
          if (currentVal >= 80) {
            setObsTemp(((currentVal - 32) / 1.8).toFixed(1));
          }
        }
      }
    }
    setRefTemp(newRef);
  };

  // Handle Category Change (with asphalt smart defaults)
  const handleCategorySelect = (cat: OilCategory) => {
    if (cat === category) return;
    setCategory(cat);
    if (!initialInput) {
      if (cat === 'asphalt') {
        // Hot liquid asphalt: default to 300°F if refTemp is 60°F, else 150°C
        if (refTemp === 60) {
          setObsTemp('300.0');
        } else {
          setObsTemp('150.0');
        }
      } else if (obsTemp === '150.0' || obsTemp === '300.0' || parseFloat(obsTemp) > 100) {
        setObsTemp('20.0');
      }
    }
  };

  // Adjust unit system and select default on user action
  const handleUnitSystemChange = (system: 'metric' | 'imperial') => {
    if (system === unitSystem) return;
    setUnitSystem(system);
    if (system === 'metric') {
      setVolumeUnit('m3');
    } else {
      setVolumeUnit('bbl');
    }
  };

  // Helper to parse density in g/cm³ from current input and mode
  const rawDensityVal = parseFloat(obsDensity) || 0;
  let parsedDensity = 0; // in g/cm³
  if (densityMode === 'g') {
    parsedDensity = rawDensityVal;
  } else if (densityMode === 'kg') {
    parsedDensity = rawDensityVal / 1000;
  } else if (densityMode === 'sg') {
    parsedDensity = rawDensityVal * 0.999012;
  } else if (densityMode === 'api') {
    const sgVal = rawDensityVal > 0 ? 141.5 / (rawDensityVal + 131.5) : 0;
    parsedDensity = sgVal * 0.999012;
  }

  // Adjust default density range when changing categories
  useEffect(() => {
    if (!initialInput) {
      const range = getDensityRange(category);
      const defaultDensityG = range.recommendMin + (range.recommendMax - range.recommendMin) / 2;
      
      if (densityMode === 'g') {
        setObsDensity(defaultDensityG.toFixed(4));
      } else if (densityMode === 'kg') {
        setObsDensity((defaultDensityG * 1000).toFixed(1));
      } else if (densityMode === 'sg') {
        setObsDensity((defaultDensityG / 0.999012).toFixed(4));
      } else if (densityMode === 'api') {
        const sg = defaultDensityG / 0.999012;
        setObsDensity(((141.5 / sg) - 131.5).toFixed(1));
      }
    }
  }, [category]);

  // Handle density unit / mode change with automatic value conversion
  const handleDensityModeChange = (newMode: DensityMode) => {
    if (newMode === densityMode) return;
    const currentDensityInG = parsedDensity;
    if (currentDensityInG > 0) {
      if (newMode === 'g') {
        setObsDensity(currentDensityInG.toFixed(4));
      } else if (newMode === 'kg') {
        setObsDensity((currentDensityInG * 1000).toFixed(1));
      } else if (newMode === 'sg') {
        setObsDensity((currentDensityInG / 0.999012).toFixed(4));
      } else if (newMode === 'api') {
        const sg = currentDensityInG / 0.999012;
        setObsDensity(((141.5 / sg) - 131.5).toFixed(1));
      }
    }
    setDensityMode(newMode);
  };

  // Parsing & Calculating reactive values
  const parsedTemp = parseFloat(obsTemp) || 0;
  const parsedVolTemp = parseFloat(volTemp) !== undefined && !isNaN(parseFloat(volTemp)) ? parseFloat(volTemp) : parsedTemp;
  const parsedVolume = parseFloat(volume) || 0;

  const currentInput: CalculationInput = {
    category,
    obsTemp: parsedTemp,
    obsDensity: parsedDensity,
    refTemp,
    volume: parsedVolume,
    volumeUnit,
    densityMode,
    asphaltMethod: 'astm_d4311',
    volTemp: parsedVolTemp,
    enableSteelExpansion,
  };

  // Perform Calculation
  let result: CalculationResult | null = null;
  let validationError = '';

  const densityRange = getDensityRange(category);
  if (parsedDensity < densityRange.min || parsedDensity > densityRange.max) {
    validationError = `该类别的真实密度通常在 ${densityRange.min.toFixed(4)} ~ ${densityRange.max.toFixed(4)} g/cm³ 之间。`;
  }

  try {
    if (parsedDensity > 0 && parsedVolume >= 0) {
      result = calculateOilMetrics(currentInput);
    }
  } catch (e) {
    result = null;
  }

  const handleSave = () => {
    if (result) {
      onSaveToHistory(currentInput, result);
    }
  };

  // Quick density temperature adjustments
  const handleQuickTemp = (val: number) => {
    const strVal = val.toFixed(1);
    handleObsTempChange(strVal);
  };

  return (
    <div className="p-4 sm:p-5 space-y-5">
      {/* Category Selection Carousel */}
      <div>
        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 tracking-wide uppercase">
          油品类别 / Oil Category
        </label>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
          {(['crude', 'diesel', 'gasoline', 'aviation', 'kerosene', 'lube', 'asphalt'] as OilCategory[]).map((cat) => {
            const isActive = category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategorySelect(cat)}
                className={`py-2 px-0.5 flex flex-col items-center justify-center rounded-xl border text-center transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105'
                    : 'bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span className="text-[11.5px] font-semibold whitespace-nowrap mb-0.5">
                  {cat === 'crude' && '原油'}
                  {cat === 'diesel' && '柴油'}
                  {cat === 'gasoline' && '汽油'}
                  {cat === 'aviation' && '航油'}
                  {cat === 'kerosene' && '煤油'}
                  {cat === 'lube' && '润滑'}
                  {cat === 'asphalt' && '沥青'}
                </span>
                <span className="text-[7.5px] opacity-75 font-mono uppercase tracking-tighter">
                  {cat === 'aviation' ? 'jet A-1' : cat}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Asphalt Specific Calculation Method Card */}
      {category === 'asphalt' && (
        <div className="bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/25 rounded-2xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-200">
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
              ASTM D4311-04 沥青体积修正标准 (Asphalt VCF)
            </div>
            <span className="text-[10px] bg-amber-600 text-white font-mono font-bold px-2 py-0.5 rounded-full shadow-xs">
              {refTemp === 60 ? 'Table 2 (60°F 基准)' : 'Table 1 (15°C 基准)'}
            </span>
          </div>

          <div className="text-[11px] text-amber-900/90 dark:text-amber-200/90 bg-amber-500/10 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-500/20 font-sans leading-relaxed space-y-2">
            <div className="font-bold flex flex-wrap items-center justify-between gap-1 border-b border-amber-500/20 pb-1.5">
              <span>算法说明：自动按密度/比重匹配 A/B 组公式</span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-amber-600 text-white font-bold">
                当前匹配: {parsedDensity * 1000 >= 966 ? 'A 组 (≥966 kg/m³ / SG≥0.967)' : 'B 组 (850~965 kg/m³ / SG 0.850~0.966)'}
              </span>
            </div>

            {/* Formula Group Display */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10.5px]">
              <div className="bg-white/60 dark:bg-slate-900/60 p-2.5 rounded-lg border border-amber-500/15 space-y-1">
                <div className="font-bold text-amber-950 dark:text-amber-100 flex items-center justify-between">
                  <span>Table 1 (15°C 基准, T 为 °C):</span>
                  {refTemp === 15 && <span className="text-[9px] bg-emerald-600 text-white px-1 rounded font-mono">当前计算中</span>}
                </div>
                <div className="font-mono text-[10px] text-slate-700 dark:text-slate-300 leading-snug space-y-0.5">
                  <p>• <strong>A 组 (稠油/铺路沥青 ≥966 kg/m³)</strong>:<br />
                    VCF₁₅ = 1.0094684 - 6.334134×10⁻⁴ T + 1.457104×10⁻⁷ T²
                  </p>
                  <p>• <strong>B 组 (稀释/液体沥青 850~965 kg/m³)</strong>:<br />
                    VCF₁₅ = 1.0108020 - 7.234352×10⁻⁴ T + 2.199660×10⁻⁷ T²
                  </p>
                </div>
              </div>

              <div className="bg-white/60 dark:bg-slate-900/60 p-2.5 rounded-lg border border-amber-500/15 space-y-1">
                <div className="font-bold text-amber-950 dark:text-amber-100 flex items-center justify-between">
                  <span>Table 2 (60°F 基准, T_F 为 °F):</span>
                  {refTemp === 60 && <span className="text-[9px] bg-emerald-600 text-white px-1 rounded font-mono">当前计算中</span>}
                </div>
                <div className="font-mono text-[10px] text-slate-700 dark:text-slate-300 leading-snug space-y-0.5">
                  <p>• <strong>A 组 (稠油/铺路沥青 SG ≥ 0.967)</strong>:<br />
                    VCF₆₀ = 1.0211326 - 3.548988×10⁻⁴ T_F + 4.49881×10⁻⁸ T_F²
                  </p>
                  <p>• <strong>B 组 (稀释/液体沥青 SG 0.850~0.966)</strong>:<br />
                    VCF₆₀ = 1.0241377 - 4.064142×10⁻⁴ T_F + 6.79176×10⁻⁸ T_F²
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unit System Toggle (公制 vs 英美制) */}
      <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-3 rounded-2xl">
        <div className="flex items-center gap-2">
          <Table2 className="w-4 h-4 text-indigo-500" />
          <div className="text-left">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">计量单位制 / Unit System</div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500">公英制切换支持重/容双向输入</div>
          </div>
        </div>
        <div className="inline-flex rounded-xl bg-slate-200/50 dark:bg-slate-800/60 p-1 gap-1">
          <button
            type="button"
            onClick={() => handleUnitSystemChange('metric')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              unitSystem === 'metric'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            公制 (Metric)
          </button>
          <button
            type="button"
            onClick={() => handleUnitSystemChange('imperial')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              unitSystem === 'imperial'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            美英制 (Imperial)
          </button>
        </div>
      </div>

      {/* Main Inputs Grid */}
      <div className="grid grid-cols-2 gap-4 bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm">
        
        {/* Input: Density / Specific Gravity / API Gravity */}
        <div className="col-span-2">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 mb-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Scale className="w-3.5 h-3.5 text-indigo-500" />
              {category === 'asphalt' 
                ? (refTemp === 60 ? '60°F 基准指标 (Relative Density / API Gravity)' : '15°C 标准密度 (Base Density @ 15°C)')
                : '实测视密 / 标准密度 (Density / SG / API)'
              }
              {category === 'asphalt' && (
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-normal ml-1">
                  (已取消视密换算)
                </span>
              )}
            </label>
            
            {/* Density / Gravity Unit Mode Toggle */}
            <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800/50 p-0.5 text-[10px] self-start sm:self-auto">
              <button
                type="button"
                onClick={() => handleDensityModeChange('g')}
                className={`px-2 py-0.5 rounded-md font-mono font-medium transition cursor-pointer ${
                  densityMode === 'g' ? 'bg-white dark:bg-slate-950 text-indigo-600 font-bold dark:text-indigo-400 shadow-xs' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                g/cm³
              </button>
              <button
                type="button"
                onClick={() => handleDensityModeChange('kg')}
                className={`px-2 py-0.5 rounded-md font-mono font-medium transition cursor-pointer ${
                  densityMode === 'kg' ? 'bg-white dark:bg-slate-950 text-indigo-600 font-bold dark:text-indigo-400 shadow-xs' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                kg/m³
              </button>
              <button
                type="button"
                onClick={() => handleDensityModeChange('sg')}
                className={`px-2 py-0.5 rounded-md font-mono font-medium transition cursor-pointer ${
                  densityMode === 'sg' ? 'bg-white dark:bg-slate-950 text-indigo-600 font-bold dark:text-indigo-400 shadow-xs' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                SG 60/60°F
              </button>
              <button
                type="button"
                onClick={() => handleDensityModeChange('api')}
                className={`px-2 py-0.5 rounded-md font-mono font-medium transition cursor-pointer ${
                  densityMode === 'api' ? 'bg-white dark:bg-slate-950 text-indigo-600 font-bold dark:text-indigo-400 shadow-xs' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                °API
              </button>
            </div>
          </div>

          <div className="relative rounded-xl shadow-inner border border-slate-200/80 dark:border-slate-800/80">
            <input
              type="number"
              step={densityMode === 'g' ? '0.0001' : densityMode === 'sg' ? '0.0001' : '0.1'}
              value={obsDensity}
              onChange={(e) => setObsDensity(e.target.value)}
              placeholder={
                densityMode === 'g' ? '1.0150' : densityMode === 'kg' ? '1015.0' : densityMode === 'sg' ? '1.0160' : '7.8'
              }
              className="w-full bg-transparent px-3.5 py-2.5 text-sm font-semibold font-mono rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
            />
          </div>

          {/* Real-time equivalents sub-bar across formats */}
          <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-1.5 px-1.5 py-1 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-100 dark:border-slate-800/60">
            <span>标密: <strong className="text-slate-700 dark:text-slate-200">{(parsedDensity * 1000).toFixed(1)} kg/m³</strong> ({parsedDensity.toFixed(4)} g/cm³)</span>
            <span>SG (60/60°F): <strong className="text-slate-700 dark:text-slate-200">{(parsedDensity > 0 ? parsedDensity / 0.999012 : 0).toFixed(4)}</strong></span>
            <span>API 重度: <strong className="text-slate-700 dark:text-slate-200">{(parsedDensity > 0 ? (141.5 / (parsedDensity / 0.999012)) - 131.5 : 0).toFixed(1)}°</strong></span>
          </div>

          {validationError ? (
            <div className="text-[10px] text-amber-500 mt-1 flex items-center gap-1 font-sans">
              <Info className="w-3 h-3 flex-shrink-0" />
              <span>{validationError}</span>
            </div>
          ) : null}
        </div>

        {/* Input: Density Observed Temp (视密测定温度) */}
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Thermometer className="w-3.5 h-3.5 text-orange-500" />
              {category === 'asphalt' && refTemp === 60 ? '视密温度 (°F)' : '视密测定温度 (°C)'}
            </span>
            {category === 'asphalt' && refTemp === 60 && (
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-medium">
                (≈ {((parsedTemp - 32) / 1.8).toFixed(1)} °C)
              </span>
            )}
          </label>
          <div className="relative rounded-xl border border-slate-200/80 dark:border-slate-800/80">
            <input
              type="number"
              step="0.1"
              value={obsTemp}
              onChange={(e) => handleObsTempChange(e.target.value)}
              className="w-full bg-transparent px-3 py-2 text-sm font-semibold font-mono rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
            />
          </div>
          {/* Quick presets for swift operation */}
          <div className="flex flex-wrap gap-1 mt-1">
            {(category === 'asphalt'
              ? (refTemp === 60 ? [70, 250, 280, 300, 320, 340, 360] : [20, 120, 130, 140, 150, 160, 170, 180])
              : [-10, 0, 15, 20, 25, 35]
            ).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => handleQuickTemp(t)}
                className={`text-[9px] font-mono font-medium px-1.5 py-0.5 rounded cursor-pointer transition ${
                  parsedTemp === t 
                    ? 'bg-indigo-600 text-white font-bold' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-600'
                }`}
              >
                {t > 0 && '+'}{t}°
              </button>
            ))}
          </div>
        </div>

        {/* Input: Reference Temp (基准温度) */}
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-blue-500" />
            基准温度 (Ref Temp)
          </label>
          <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl h-[38px] items-center">
            <button
              type="button"
              onClick={() => handleRefTempChange(15)}
              className={`py-1 text-[11px] font-semibold font-mono rounded-lg transition-colors cursor-pointer ${
                refTemp === 15 ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              15 °C
            </button>
            <button
              type="button"
              onClick={() => handleRefTempChange(60)}
              className={`py-1 text-[11px] font-semibold font-mono rounded-lg transition-colors cursor-pointer ${
                refTemp === 60 ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              60 °F
            </button>
            <button
              type="button"
              onClick={() => handleRefTempChange(20)}
              className={`py-1 text-[11px] font-semibold font-mono rounded-lg transition-colors cursor-pointer ${
                refTemp === 20 ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              20 °C
            </button>
          </div>
          <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 block">
            {category === 'asphalt' ? 'ASTM D4311 表1 (15°C) / 表2 (60°F)' : '国际 (15°C / 60°F) / 中国国标 (20°C)'}
          </span>
        </div>

        {/* Input: Observed Volume & Temperature (实测数量/体积、计量温度、钢膨选项) */}
        <div className="col-span-2 border-t border-slate-100 dark:border-slate-800/50 pt-3 space-y-3">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-teal-500" />
              实测数量 ({['kg', 't', 'lb'].includes(volumeUnit) ? '重量 Wt' : '体积 Vol'})
            </label>
            <div className="flex flex-wrap gap-0.5 rounded-xl bg-slate-100 dark:bg-slate-800/50 p-0.5 text-[10px]">
              {unitSystem === 'metric' ? (
                <>
                  {(['m3', 'L', 'kg', 't'] as VolumeUnit[]).map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setVolumeUnit(u)}
                      className={`px-2 py-0.5 rounded-md font-mono font-bold cursor-pointer transition ${
                        volumeUnit === u ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                      }`}
                    >
                      {u === 'm3' ? 'm³' : u === 'L' ? '升 L' : u === 'kg' ? 'kg' : 't(吨)'}
                    </button>
                  ))}
                </>
              ) : (
                <>
                  {(['bbl', 'gal', 'uk_gal', 'lb'] as VolumeUnit[]).map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setVolumeUnit(u)}
                      className={`px-2 py-0.5 rounded-md font-mono font-bold cursor-pointer transition ${
                        volumeUnit === u ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                      }`}
                    >
                      {u === 'bbl' ? 'bbl(桶)' : u === 'gal' ? '美加仑' : u === 'uk_gal' ? '英加仑' : 'lb(磅)'}
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>

          <div className="relative rounded-xl border border-slate-200/80 dark:border-slate-800/80 font-mono">
            <input
              type="number"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
              placeholder="100.0"
              className="w-full bg-transparent px-3 py-2 text-sm font-semibold rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
            />
          </div>

          {/* Sub-card: Volume Temperature & Steel Thermal Expansion Toggle */}
          <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 p-3 rounded-xl space-y-3">
            
            {/* Volume Measured Temperature (实测体积油温) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Thermometer className="w-3.5 h-3.5 text-teal-500" />
                  实测体积温度 / 油罐油温 ({category === 'asphalt' && refTemp === 60 ? '°F' : '°C'})
                </label>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                  体积修正系数 (VCF) 按照此温度计算
                </span>
              </div>

              <div className="flex items-center gap-2">
                {isVolTempCustom ? (
                  <button
                    type="button"
                    onClick={handleSyncVolTemp}
                    className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer"
                  >
                    同步视密温度 ({obsTemp}°)
                  </button>
                ) : (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-medium bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                    与视密温度同步
                  </span>
                )}
                <div className="w-28 relative rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-950">
                  <input
                    type="number"
                    step="0.1"
                    value={volTemp}
                    onChange={(e) => {
                      setVolTemp(e.target.value);
                      setIsVolTempCustom(true);
                    }}
                    className="w-full bg-transparent px-2.5 py-1.5 text-xs font-bold font-mono text-right rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
            </div>

            {/* Quick Presets for Volume Temperature */}
            <div className="flex flex-wrap items-center gap-1 border-t border-slate-200/40 dark:border-slate-800/40 pt-2">
              <span className="text-[10px] text-slate-400 mr-1">快捷设温:</span>
              {(category === 'asphalt'
                ? (refTemp === 60 ? [70, 250, 280, 300, 320, 340, 360] : [20, 120, 130, 140, 150, 160, 170, 180])
                : [-10, 0, 15, 20, 25, 35]
              ).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setVolTemp(t.toFixed(1));
                    setIsVolTempCustom(true);
                  }}
                  className={`text-[9px] font-mono font-medium px-1.5 py-0.5 rounded cursor-pointer transition ${
                    parsedVolTemp === t 
                      ? 'bg-teal-600 text-white font-bold' 
                      : 'bg-white dark:bg-slate-800 text-slate-500 hover:text-teal-600 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {t > 0 && '+'}{t}°
                </button>
              ))}
            </div>

            {/* Steel Thermal Expansion Option (计算钢膨) */}
            <div className="border-t border-slate-200/40 dark:border-slate-800/40 pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableSteelExpansion}
                    onChange={(e) => setEnableSteelExpansion(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span>计算容器钢热膨胀 (钢膨)</span>
                </label>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 ml-5">
                  钢膨温度为体积温度 ({volTemp}{category === 'asphalt' && refTemp === 60 ? '°F' : '°C'})，体膨系数 β = 3.6×10⁻⁵ /°C
                </span>
              </div>

              <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md self-start sm:self-center ${
                enableSteelExpansion
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                  : 'bg-slate-200/60 dark:bg-slate-800 text-slate-400'
              }`}>
                {enableSteelExpansion ? '已启用钢膨修正' : '不计算钢膨'}
              </span>
            </div>

          </div>
        </div>

      </div>

      {/* outputs & conversions Results Section */}
      {result && (
        <div className="space-y-4">
          
          {/* Main outputs bento board */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-5 shadow-inner border border-indigo-950 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-xl -mr-6 -mt-6"></div>
            
            <h2 className="text-xs font-bold tracking-widest text-indigo-200 uppercase mb-3 flex items-center gap-1">
              <ArrowRight className="w-3.5 h-3.5 text-amber-400 rotate-45" />
              转换标准输出 (Standard Outputs)
            </h2>

            <div className="grid grid-cols-2 gap-4">
              
              {/* Output 1: Standard Density */}
              <div className="col-span-2 bg-white/5 border border-white/5 rounded-xl p-3.5">
                <span className="text-[10px] text-indigo-200 font-bold tracking-wider block mb-1">
                  基准：{refTemp === 60 ? '60°F' : `${refTemp}°C`} 标准密度
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black font-mono text-amber-300">
                    {result.standardDensityG.toFixed(4)}
                  </span>
                  <span className="text-[11px] font-mono text-indigo-200">g/cm³</span>
                  <span className="text-sm font-semibold font-mono text-indigo-300 ml-auto bg-white/10 px-2 py-0.5 rounded">
                    {result.standardDensityKg.toFixed(1)} kg/m³
                  </span>
                </div>
              </div>

              {/* Output 2: API Gravity */}
              <div className="bg-white/5 border border-white/5 rounded-xl p-3">
                <span className="text-[10px] text-indigo-200 font-bold tracking-wider block mb-0.5">
                  API 度
                </span>
                <span className="text-lg font-black font-mono text-teal-300">
                  {result.apiGravity.toFixed(2)}°
                </span>
                <span className="text-[9px] text-indigo-300/85 block mt-0.5 font-sans leading-none">SG: {(result.standardDensityKg / 999.012).toFixed(4)}</span>
              </div>

              {/* Output 3: VCF Factor */}
              <div className="bg-white/5 border border-white/5 rounded-xl p-3">
                <span className="text-[10px] text-indigo-200 font-bold tracking-wider block mb-0.5">
                  油品体积修正系数 (VCF)
                </span>
                <span className="text-lg font-black font-mono text-emerald-300">
                  {result.vcf.toFixed(5)}
                </span>
                <span className="text-[9px] text-indigo-300/85 block mt-0.5 font-sans leading-none">
                  依据 {getVcfStandardLabel(category, refTemp, currentInput.asphaltMethod, currentInput.asphaltGamma)} (@{parsedVolTemp}{category === 'asphalt' && refTemp === 60 ? '°F' : '°C'})
                </span>
              </div>

              {/* Output 3b: Steel Expansion Factor if enabled */}
              {enableSteelExpansion && (
                <div className="col-span-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-amber-200 font-bold tracking-wider block mb-0.5">
                      容器钢膨系数 (f_st)
                    </span>
                    <span className="text-lg font-black font-mono text-amber-300">
                      {result.steelExpansionFactor.toFixed(6)}
                    </span>
                    <span className="text-[9px] text-amber-300/80 block mt-0.5">
                      钢罐温度: {parsedVolTemp}{category === 'asphalt' && refTemp === 60 ? '°F' : '°C'}
                    </span>
                  </div>
                  <div className="text-right border-l border-amber-500/20 pl-4">
                    <span className="text-[10px] text-indigo-200 font-bold tracking-wider block mb-0.5">
                      综合体积修正系数 (VCF_total)
                    </span>
                    <span className="text-xl font-black font-mono text-white">
                      {result.totalVcf.toFixed(5)}
                    </span>
                  </div>
                </div>
              )}

              {/* Output 4: Standard Volume */}
              <div className="col-span-2 bg-gradient-to-r from-emerald-950/40 to-indigo-950/40 border border-emerald-500/10 rounded-xl p-3.5">
                <span className="text-[10px] text-emerald-300 font-bold tracking-wider block mb-1">
                  基准：{refTemp === 60 ? '60°F' : `${refTemp}°C`} 标准体积 (Standard Volume)
                </span>
                {unitSystem === 'metric' ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-emerald-400 font-mono">
                      {result.standardVolumeM3.toFixed(3)}
                    </span>
                    <span className="text-xs font-mono text-indigo-200 font-semibold"> m³</span>
                    <span className="text-xs font-mono text-emerald-500 ml-auto font-medium">
                      {(result.standardVolumeL).toLocaleString([], {maximumFractionDigits: 1})} L (升)
                    </span>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-emerald-400 font-mono">
                      {result.barrels.toFixed(2)}
                    </span>
                    <span className="text-xs font-mono text-indigo-200 font-semibold"> bbl (桶)</span>
                    <span className="text-xs font-mono text-emerald-400 ml-auto font-medium">
                      {result.usGallons.toFixed(1)} 美加仑
                    </span>
                  </div>
                )}
              </div>

              {/* Output 5: Weight in Vacuum vs Weight in Air */}
              <div className="col-span-2 bg-gradient-to-br from-blue-950/45 to-indigo-950/45 border border-blue-500/15 rounded-xl p-3.5 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Vacuum Weight Sub-block */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                      <span className="text-[10px] text-blue-300 font-bold tracking-wider uppercase">
                        {refTemp === 60 ? '60°F' : `${refTemp}°C`} 真空标准重量 (Vacuum Weight)
                      </span>
                    </div>
                    {unitSystem === 'metric' ? (
                      <div className="space-y-1">
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-black text-blue-400 font-mono">
                            {(result.standardWeightTon ?? (result.standardVolumeM3 * result.standardDensityKg / 1000)).toFixed(4)}
                          </span>
                          <span className="text-xs font-mono text-indigo-400 font-semibold"> t (公吨)</span>
                        </div>
                        <div className="text-[11px] font-mono text-blue-400/85 font-medium">
                          {(result.standardWeightKg ?? (result.standardVolumeL * (result.standardDensityKg / 1000))).toLocaleString([], {maximumFractionDigits: 1})} kg (千克)
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-black text-blue-400 font-mono">
                            {(result.standardWeightLb ?? (result.standardVolumeL * (result.standardDensityKg / 1000) / 0.45359237)).toLocaleString([], {maximumFractionDigits: 1})}
                          </span>
                          <span className="text-xs font-mono text-indigo-400 font-semibold"> lb (磅)</span>
                        </div>
                        <div className="text-[11px] font-mono text-blue-400/85 font-medium">
                          ≈ {((result.standardWeightTon ?? (result.standardVolumeM3 * result.standardDensityKg / 1000))).toFixed(4)} t (公吨)
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Weight in Air Sub-block (BUOYANCY CORRECTED) */}
                  <div className="space-y-1.5 border-t md:border-t-0 md:border-l border-white/10 md:pl-4 pt-2 md:pt-0">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                      <span className="text-[10px] text-cyan-300 font-bold tracking-wider uppercase flex items-center gap-1">
                        {refTemp === 60 ? '60°F' : `${refTemp}°C`} 空气中重量 (Buoyancy / Weight in Air)
                      </span>
                    </div>
                    {unitSystem === 'metric' ? (
                      <div className="space-y-1">
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-black text-cyan-400 font-mono">
                            {(result.airWeightTon ?? (result.standardVolumeM3 * (result.standardDensityKg - 1.1) / 1000)).toFixed(4)}
                          </span>
                          <span className="text-xs font-mono text-cyan-400 font-semibold"> t (商用吨)</span>
                        </div>
                        <div className="text-[11px] font-mono text-cyan-400/85 font-medium">
                          {(result.airWeightKg ?? (result.standardVolumeM3 * (result.standardDensityKg - 1.1))).toLocaleString([], {maximumFractionDigits: 1})} kg (千克)
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-black text-cyan-400 font-mono">
                            {(result.airWeightLb ?? (result.standardVolumeM3 * (result.standardDensityKg - 1.1) / 0.45359237)).toLocaleString([], {maximumFractionDigits: 1})}
                          </span>
                          <span className="text-xs font-mono text-cyan-400 font-semibold"> lb (商用磅)</span>
                        </div>
                        <div className="text-[11px] font-mono text-cyan-400/85 font-medium">
                          ≈ {((result.airWeightTon ?? (result.standardVolumeM3 * (result.standardDensityKg - 1.1) / 1000))).toFixed(4)} t (商用吨)
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Subtext info detailing air buoyancy correction */}
                <div className="text-[10px] text-slate-400/90 leading-normal font-sans bg-black/15 p-2 rounded-lg border border-white/5">
                  💡 <span className="font-semibold text-slate-300">空气浮力扣除修正说明</span>：商用或港口贸易重量结算通常以空气中重量（商用质量）为准，计算时扣除空气平均浮力修正值（按GB/T 1885 / ASTM扣除 <code className="text-amber-200/80 font-mono">1.1 kg/m³</code>），即 <code className="text-cyan-300 font-mono">空气中重量 = 标体 × (真空标密 - 1.1)</code>。
                </div>
              </div>

              {/* Output 6: Contrast system conversions */}
              <div className="col-span-2 border-t border-white/10 pt-3 mt-1">
                <span className="text-[10px] text-indigo-200 font-bold block mb-2">
                  {unitSystem === 'metric' ? '英美制换算对照 (Imperial Comparisons)' : '公制换算对照 (Metric Comparisons)'}
                </span>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {unitSystem === 'metric' ? (
                    <>
                      <div className="bg-white/5 rounded-lg p-2 text-center">
                        <span className="text-[9px] text-indigo-300 font-bold block leading-none">美制桶</span>
                        <span className="text-xs font-bold font-mono text-amber-200 mt-1 block">
                          {result.barrels.toFixed(2)} bbl
                        </span>
                      </div>

                      <div className="bg-white/5 rounded-lg p-2 text-center">
                        <span className="text-[9px] text-indigo-300 font-bold block leading-none">美制加仑</span>
                        <span className="text-xs font-bold font-mono text-amber-200 mt-1 block font-semibold">
                          {result.usGallons.toFixed(0)} gal
                        </span>
                      </div>

                      <div className="bg-white/5 rounded-lg p-2 text-center">
                        <span className="text-[9px] text-indigo-300 font-bold block leading-none">英制加仑</span>
                        <span className="text-xs font-bold font-mono text-amber-200 mt-1 block font-semibold">
                          {result.ukGallons.toFixed(1)} gal
                        </span>
                      </div>

                      <div className="bg-white/5 rounded-lg p-2 text-center">
                        <span className="text-[9px] text-indigo-300 font-bold block leading-none">英制磅数</span>
                        <span className="text-xs font-bold font-mono text-amber-200 mt-1 block">
                          {(result.standardWeightLb ?? (result.standardVolumeL * result.standardDensityG / 0.45359237)).toLocaleString([], {maximumFractionDigits:0})} lb
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-white/5 rounded-lg p-2 text-center col-span-1">
                        <span className="text-[9px] text-indigo-300 font-bold block leading-none">立方米</span>
                        <span className="text-xs font-bold font-mono text-amber-200 mt-1 block">
                          {result.standardVolumeM3.toFixed(3)} m³
                        </span>
                      </div>

                      <div className="bg-white/5 rounded-lg p-2 text-center col-span-1">
                        <span className="text-[9px] text-indigo-300 font-bold block leading-none">公制升</span>
                        <span className="text-xs font-bold font-mono text-amber-200 mt-1 block font-semibold">
                          {result.standardVolumeL.toLocaleString([], {maximumFractionDigits:0})} L
                        </span>
                      </div>

                      <div className="bg-white/5 rounded-lg p-2 text-center col-span-2 sm:col-span-2">
                        <span className="text-[9px] text-indigo-300 font-bold block leading-none">公制吨</span>
                        <span className="text-xs font-bold font-mono text-amber-200 mt-1 block">
                          {(result.standardWeightTon ?? (result.standardVolumeM3 * result.standardDensityKg / 1000)).toFixed(3)} t
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

            </div>

            {/* Quick Action bar inside card */}
            <div className="mt-4 pt-3.5 border-t border-white/10 flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-1.5 px-3.5 rounded-xl transition shadow flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 text-white" />
                保存记录至历史
              </button>
            </div>

          </div>

          {/* Interactive Physics Diagram widget */}
          <VisualExpansionModel
            category={category}
            obsTemp={parsedTemp}
            stdDensityKg={result.standardDensityKg}
            obsDensityKg={parsedDensity * 1000}
            vcf={result.vcf}
            tempUnit={category === 'asphalt' && refTemp === 60 ? '°F' : '°C'}
          />
        </div>
      )}

      {!result && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <HelpCircle className="w-6 h-6 text-amber-500 mx-auto mb-1.5" />
          <p className="text-xs font-semibold text-amber-800">
            等待输入正确的油品密度及体积。
          </p>
          <p className="text-[10px] text-amber-600/80 mt-0.5">
            请输入有效参数进行离线计算。
          </p>
        </div>
      )}
    </div>
  );
}
