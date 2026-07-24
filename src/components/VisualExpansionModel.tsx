/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { OilCategory } from '../types';
import { getCategoryLabel } from '../utils/calculator';

interface VisualExpansionModelProps {
  category: OilCategory;
  obsTemp: number;
  stdDensityKg: number;
  obsDensityKg: number;
  vcf: number;
  tempUnit?: string;
}

export default function VisualExpansionModel({
  category,
  obsTemp,
  stdDensityKg,
  obsDensityKg,
  vcf,
  tempUnit = '°C',
}: VisualExpansionModelProps) {
  // Compute expansion percentage
  // VCF = V_std / V_obs = rho_obs / rho_std
  // If VCF < 1, then V_std < V_obs (expanded at high temp, e.g. obsTemp > 15/20)
  // If VCF > 1, then V_std > V_obs (contracted at low temp, e.g. obsTemp < 15/20)
  const expansionPct = (1 / vcf - 1) * 100;
  
  // Choose liquid color based on category
  let liquidColor = 'bg-amber-800 border-amber-900'; // crude
  let textColor = 'text-amber-800';
  if (category === 'gasoline') {
    liquidColor = 'bg-sky-400/80 border-sky-600';
    textColor = 'text-sky-600';
  } else if (category === 'diesel') {
    liquidColor = 'bg-yellow-500/90 border-yellow-700';
    textColor = 'text-amber-600';
  } else if (category === 'lube') {
    liquidColor = 'bg-orange-400 border-orange-600';
    textColor = 'text-orange-600';
  } else if (category === 'asphalt') {
    liquidColor = 'bg-zinc-800 border-zinc-950';
    textColor = 'text-zinc-800';
  }

  return (
    <div className="bg-slate-50 border border-slate-100 dark:bg-slate-900 dark:border-slate-800/60 rounded-2xl p-5 mt-4 transition-all duration-300">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
          热胀冷缩物理模拟 (Thermal Expansion)
        </h3>
        <span className="text-xs font-medium text-slate-400 dark:text-slate-500 font-mono">
          AT {obsTemp.toFixed(1)}{tempUnit}
        </span>
      </div>

      <div className="grid grid-cols-12 gap-4 items-center">
        {/* Left side: Animated physics cylinder tank */}
        <div className="col-span-5 flex flex-col items-center">
          <div className="relative w-16 h-32 bg-slate-200/60 border-2 border-slate-300 dark:bg-slate-800/40 dark:border-slate-700 rounded-t-lg rounded-b-xl overflow-hidden flex flex-col justify-end shadow-inner">
            {/* Standard line indicator */}
            <div className="absolute bottom-[50%] left-0 right-0 border-t border-dashed border-indigo-400/80 z-20">
              <span className="absolute right-1 -top-3.5 text-[8px] font-mono font-semibold text-indigo-500/90 dark:text-indigo-400">
                标准体积
              </span>
            </div>

            {/* Simulated Animated Liquid */}
            <div 
              className={`w-full transition-all duration-700 ease-out border-t-2 ${liquidColor}`}
              style={{ height: `${Math.max(10, Math.min(90, 50 + expansionPct * 5))}%` }}
            >
              {/* Liquid micro particles animation */}
              <div className="absolute inset-0 opacity-15 pointer-events-none overflow-hidden">
                <div className="absolute w-1 h-1 bg-white rounded-full animate-bounce top-1/4 left-1/4"></div>
                <div className="absolute w-1.5 h-1.5 bg-white rounded-full animate-bounce top-2/4 left-2/3 delay-300"></div>
                <div className="absolute w-1 h-1 bg-white rounded-full animate-bounce top-3/4 left-1/3 delay-700"></div>
              </div>
            </div>
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-sans text-center">
            油体分布模拟器
          </span>
        </div>

        {/* Right side: Physics facts bento info */}
        <div className="col-span-7 space-y-2">
          <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            该温度下油品体积较基准状态
            {expansionPct >= 0 ? (
              <span className="text-emerald-500 font-semibold mx-1">膨胀了 {expansionPct.toFixed(3)}%</span>
            ) : (
              <span className="text-indigo-500 font-semibold mx-1">收缩了 {Math.abs(expansionPct).toFixed(3)}%</span>
            )}
            。
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800/50 pt-2 space-y-1.5">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-slate-400 dark:text-slate-500">实测视密:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {obsDensityKg.toFixed(1)} kg/m³
              </span>
            </div>
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-slate-400 dark:text-slate-500">标准密度:</span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                {stdDensityKg.toFixed(1)} kg/m³
              </span>
            </div>
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-slate-400 dark:text-slate-500">修正系数 (VCF):</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {vcf.toFixed(5)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
