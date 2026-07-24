/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import MobileFrame from './components/MobileFrame';
import CalculatorForm from './components/CalculatorForm';
import HistoryList from './components/HistoryList';
import { CalculationInput, CalculationResult, HistoryRecord } from './types';
import { 
  Calculator, History, BookOpen, AlertCircle, Sparkles, 
  Settings, ChevronRight, HelpCircle, HardDriveDownload,
  Sun, Moon
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'calc' | 'info'>('calc');
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [reloadedInput, setReloadedInput] = useState<CalculationInput | undefined>(undefined);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved === 'light' || saved === 'dark') {
        return saved;
      }
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return 'light';
  });

  // Apply theme class to document root & persist to localStorage
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('theme', theme);
    } catch (e) {
      console.error('Failed to save theme preference', e);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Load history from localStorage on startup
  useEffect(() => {
    try {
      const stored = localStorage.getItem('oil_calc_history');
      if (stored) {
        setRecords(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load history', e);
    }
  }, []);

  // Save record to local list & LocalStorage (Full offline persistence)
  const handleSaveToHistory = (input: CalculationInput, result: CalculationResult) => {
    const newRecord: HistoryRecord = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      input,
      result,
    };
    const updated = [newRecord, ...records].slice(0, 50); // limit to last 50 entries
    setRecords(updated);
    try {
      localStorage.setItem('oil_calc_history', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to write history', e);
    }
  };

  const handleDeleteRecord = (id: string) => {
    const updated = records.filter(r => r.id !== id);
    setRecords(updated);
    try {
      localStorage.setItem('oil_calc_history', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to delete history item', e);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('您确定要清空所有的历史计算记录吗？')) {
      setRecords([]);
      try {
        localStorage.removeItem('oil_calc_history');
      } catch (e) {
        console.error('Failed to clear history', e);
      }
    }
  };

  const handleReloadRecord = (record: HistoryRecord) => {
    setReloadedInput(record.input);
    setActiveTab('calc');
    // Fast flash animation or scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <MobileFrame theme={theme} onToggleTheme={toggleTheme}>
       {/* Tab Selectors */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/80 grid grid-cols-2 sticky top-0 z-30">
        <button
          onClick={() => setActiveTab('calc')}
          className={`py-3.5 text-xs font-semibold tracking-tight transition-all relative flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'calc'
              ? 'text-slate-900 dark:text-white font-bold'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350'
          }`}
        >
          <Calculator className={`w-3.5 h-3.5 transition-transform duration-200 ${activeTab === 'calc' ? 'scale-110 text-slate-900 dark:text-indigo-400' : 'opacity-70'}`} />
          密度/体积换算
          {activeTab === 'calc' && (
            <div className="absolute bottom-0 left-[25%] right-[25%] h-[2px] bg-slate-900 dark:bg-indigo-400 rounded-full"></div>
          )}
        </button>

        <button
          onClick={() => setActiveTab('info')}
          className={`py-3.5 text-xs font-semibold tracking-tight transition-all relative flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'info'
              ? 'text-slate-900 dark:text-white font-bold'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350'
          }`}
        >
          <BookOpen className={`w-3.5 h-3.5 transition-transform duration-200 ${activeTab === 'info' ? 'scale-110 text-slate-900 dark:text-indigo-400' : 'opacity-70'}`} />
          计算原理与说明
          {activeTab === 'info' && (
            <div className="absolute bottom-0 left-[25%] right-[25%] h-[2px] bg-slate-900 dark:bg-indigo-400 rounded-full"></div>
          )}
        </button>
      </div>

      {activeTab === 'calc' ? (
        <div className="pb-8 space-y-4">
          
          {/* Main Calculation form */}
          <CalculatorForm 
            onSaveToHistory={handleSaveToHistory} 
            initialInput={reloadedInput}
          />

          {/* History log block */}
          <div className="px-4 pb-4">
            <HistoryList
              records={records}
              onDeleteRecord={handleDeleteRecord}
              onClearAll={handleClearAll}
              onReloadRecord={handleReloadRecord}
            />
          </div>

        </div>
      ) : (
        <div className="p-4 sm:p-5 space-y-5 pb-8">
          
          {/* Quick Notice Card */}
          <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/80 rounded-xl p-4 flex gap-3 shadow-xs">
            <AlertCircle className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-600 dark:text-slate-450 leading-normal font-sans">
              <p className="font-bold text-slate-800 dark:text-slate-200 mb-0.5">免责声明 & 专业提示</p>
              本应用内置计算遵循经典 
              <strong className="mx-1 text-slate-800 dark:text-slate-200">ASTM D1250-1980 (Table 54A/B/D)</strong> 极具行业公信力的石油计量表，计算结果符合工程估算及大宗贸易概算，正式交割请以法定质采化验表为准。
            </div>
          </div>

          <h2 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase mb-1">
            核心计算原理 / Standard Formulation
          </h2>

          <div className="space-y-4">
            
            {/* Box 1: Refined Products & Crude */}
            <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-850 dark:text-slate-200">
                <div className="w-1 h-3 bg-slate-900 dark:bg-indigo-400 rounded-full"></div>
                ASTM D1250 热膨胀系数公式 (VCF)
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
                除沥青外，本软件对原油、汽油、柴油、润滑油采用双温标修正补偿：
              </p>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg text-center text-xs font-mono text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800/80 select-all">
                VCF = exp(-α · ΔT · (1 + 0.8 · α · ΔT))
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-550 font-sans">
                其中 <code className="font-mono bg-slate-50 dark:bg-slate-900 px-1 py-0.5 rounded text-[9px] border border-slate-200/40 dark:border-slate-800">ΔT = 视温 - 15</code> (或20)；
                温变因子为 <code className="font-mono bg-slate-50 dark:bg-slate-900 px-1 py-0.5 rounded text-[9px] border border-slate-200/40 dark:border-slate-800">α = K0 / (标密)² + K1 / 标密</code>。
              </p>
            </div>

            {/* Box 2: Coefficients table */}
            <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-850 dark:text-slate-200">
                <div className="w-1 h-3 bg-slate-900 dark:bg-indigo-400 rounded-full"></div>
                内置常量系数表 (Built-in Constants)
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[10px] font-mono text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400">
                      <th className="pb-1.5 font-bold">油品类别</th>
                      <th className="pb-1.5 text-right">K0 常数</th>
                      <th className="pb-1.5 text-right">K1 常数</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60 text-slate-600 dark:text-slate-350">
                    <tr>
                      <td className="py-1.5 font-medium text-slate-800 dark:text-slate-200">原油 (Crude)</td>
                      <td className="py-1.5 text-right font-semibold">613.9723</td>
                      <td className="py-1.5 text-right">0.0000</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 font-medium text-slate-800 dark:text-slate-200">汽油 (Gasoline)</td>
                      <td className="py-1.5 text-right font-semibold">346.7008</td>
                      <td className="py-1.5 text-right">0.4388</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 font-medium text-slate-800 dark:text-slate-200">柴油 / 燃料油</td>
                      <td className="py-1.5 text-right font-semibold">103.8720</td>
                      <td className="py-1.5 text-right">0.7019</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 font-medium text-slate-800 dark:text-slate-200">润滑油 (Lube)</td>
                      <td className="py-1.5 text-right">0.0000</td>
                      <td className="py-1.5 text-right font-semibold">0.6278</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 font-medium text-slate-800 dark:text-slate-200">航空燃料 (Aviation)</td>
                      <td className="py-1.5 text-right font-semibold">103.8720</td>
                      <td className="py-1.5 text-right">0.7019</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 font-medium text-slate-800 dark:text-slate-200">煤油 (Kerosene)</td>
                      <td className="py-1.5 text-right font-semibold">103.8720</td>
                      <td className="py-1.5 text-right">0.7019</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-sans mt-1">
                注：沥青 (Asphalt) 不适用 ASTM D1250 的 K0/K1 系数表，已独立按 ASTM D4311 标准公式计算。
              </p>
            </div>

            {/* Box 3: Asphalt ASTM D4311-04 Specific Box */}
            <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-850 dark:text-slate-200">
                <div className="w-1 h-3 bg-amber-500 rounded-full"></div>
                ASTM D4311-04 沥青专有体积修正计算规范 (Asphalt VCF)
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
                沥青采用独立的 <strong>ASTM D4311-04</strong> 标准算法，根据标密或比重自动匹配 A/B 组公式：
              </p>

              <div className="space-y-2 text-[11px]">
                {/* Condition Box */}
                <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                  <div className="font-bold text-slate-800 dark:text-slate-200 mb-1">
                    1. 公式选用条件 (Group Selection Criteria):
                  </div>
                  <ul className="space-y-1 text-[10.5px] text-slate-600 dark:text-slate-400 list-disc pl-4 font-sans">
                    <li>
                      <strong>Column A (A 组 - 稠油 / 铺路沥青)</strong>: 15°C 标密 ≥ 966 kg/m³ (0.966 g/cm³)，或 60°F 比重 SG ≥ 0.967 (API 重度 ≤ 14.9°)。
                    </li>
                    <li>
                      <strong>Column B (B 组 - 液体 / 稀释沥青)</strong>: 15°C 标密 850 ~ 965 kg/m³ (0.850 ~ 0.965 g/cm³)，或 60°F 比重 SG 0.850 ~ 0.966 (API 重度 15.0° ~ 34.9°)。
                    </li>
                  </ul>
                </div>

                {/* Both Formulas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10.5px]">
                  <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                    <div className="font-bold text-slate-800 dark:text-slate-200 mb-1">
                      2. 15°C 基准公式 (Table 1, T 单位为 °C):
                    </div>
                    <p className="font-mono text-[10px] text-slate-700 dark:text-slate-300 leading-relaxed">
                      • <strong>A 组 (≥966 kg/m³)</strong>:<br />
                      VCF₁₅ = 1.0094684142 - 6.33413410744×10⁻⁴ T + 1.45710416212×10⁻⁷ T²<br />
                      • <strong>B 组 (850~965 kg/m³)</strong>:<br />
                      VCF₁₅ = 1.0108020095 - 7.2343515319×10⁻⁴ T + 2.1996598346×10⁻⁷ T²
                    </p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                    <div className="font-bold text-slate-800 dark:text-slate-200 mb-1">
                      3. 60°F 基准公式 (Table 2, T_F 单位为 °F):
                    </div>
                    <p className="font-mono text-[10px] text-slate-700 dark:text-slate-300 leading-relaxed">
                      • <strong>A 组 (SG ≥ 0.967)</strong>:<br />
                      VCF₆₀ = 1.0211326242 - 3.548988118×10⁻⁴ T_F + 4.49881×10⁻⁸ T_F²<br />
                      • <strong>B 组 (SG 0.850~0.966)</strong>:<br />
                      VCF₆₀ = 1.02413769 - 4.0641418×10⁻⁴ T_F + 6.79176×10⁻⁸ T_F²
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Box 3: Conversions definition */}
            <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-850 dark:text-slate-200">
                <div className="w-1 h-3 bg-slate-900 dark:bg-indigo-400 rounded-full"></div>
                高保真多维度体积转换
              </div>
              <ul className="space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400 leading-normal list-none">
                <li className="flex items-start gap-1.5">
                  <span className="text-slate-900 dark:text-slate-300">•</span>
                  <span><strong className="text-slate-800 dark:text-slate-200 font-mono">美制桶 (Barrels):</strong> 1 m³ 标准体积 = 6.289811 bbl。</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-slate-900 dark:text-slate-300">•</span>
                  <span><strong className="text-slate-800 dark:text-slate-200 font-mono">美国加仑 (US Gal):</strong> 1 m³ 标准体积 = 264.172052 US gal。</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-slate-900 dark:text-slate-300">•</span>
                  <span><strong className="text-slate-800 dark:text-slate-200 font-mono">英国加仑 (UK Gal):</strong> 1 m³ 标准体积 = 219.969248 Imp gal。</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-slate-900 dark:text-slate-300">•</span>
                  <span><strong className="text-slate-800 dark:text-slate-200 font-mono">比重及API度:</strong> <code className="font-mono bg-slate-50 dark:bg-slate-900 px-1 rounded text-[10px] border border-slate-100 dark:border-slate-800/80">API = 141.5 / SG - 131.5</code>, SG为标准相对密度。</span>
                </li>
              </ul>
            </div>
            {/* Box 4: System Settings */}
            <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-850 dark:text-slate-200">
                <Settings className="w-4 h-4 text-indigo-500" />
                偏好设置 (System Settings)
              </div>
              <div className="flex items-center justify-between text-xs p-1">
                <div className="space-y-0.5">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">手动切换暗色模式</span>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">保存首选项，自适应系统主题</p>
                </div>
                <button
                  onClick={toggleTheme}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-250 border border-slate-200/60 dark:border-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
                  id="settings-theme-toggle"
                >
                  {theme === 'light' ? (
                    <>
                      <Moon className="w-3.5 h-3.5" />
                      深色模式
                    </>
                  ) : (
                    <>
                      <Sun className="w-3.5 h-3.5 text-amber-400" />
                      浅色模式
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>

          {/* Bottom offline cache status */}
          <div className="flex items-center justify-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-800/50">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 font-mono">
              OFFLINE CACHE COMPLIANT • PWA READY
            </span>
          </div>

        </div>
      )}
    </MobileFrame>
  );
}
