/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HistoryRecord } from '../types';
import { getCategoryLabel } from '../utils/calculator';
import { Trash2, RotateCcw, Clock, Award, Tag } from 'lucide-react';

interface HistoryListProps {
  records: HistoryRecord[];
  onDeleteRecord: (id: string) => void;
  onClearAll: () => void;
  onReloadRecord: (record: HistoryRecord) => void;
}

export default function HistoryList({
  records,
  onDeleteRecord,
  onClearAll,
  onReloadRecord,
}: HistoryListProps) {
  if (records.length === 0) {
    return (
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-2xl p-6 text-center">
        <Clock className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
        <p className="text-xs text-slate-400 dark:text-slate-500">
          暂无历史计算记录。计算结果将自动保存在此，支持离线查看。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          历史换算记录 ({records.length})
        </span>
        <button
          onClick={onClearAll}
          className="text-xs font-medium text-red-500 hover:text-red-600 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <Trash2 className="w-3 h-3" />
          清空
        </button>
      </div>

      <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
        {records.map((record) => {
          const volTempNum = record.input.volTemp !== undefined ? record.input.volTemp : record.input.obsTemp;
          const tempUnit = record.input.category === 'asphalt' && record.input.refTemp === 60 ? '°F' : '°C';
          const volTempStr = `${volTempNum}${tempUnit}`;
          const isSteelEnabled = !!record.input.enableSteelExpansion;

          return (
            <div
              key={record.id}
              className="group relative bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 rounded-xl p-3.5 transition-all duration-200 hover:shadow-md hover:border-indigo-100 dark:hover:border-indigo-900/40"
            >
              <div className="flex items-start justify-between">
                <div className="w-full">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 text-[10px] font-medium bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded">
                      {getCategoryLabel(record.input.category).split(' ')[0]}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                      基准: {record.input.refTemp === 60 ? '60°F' : `${record.input.refTemp}°C`}
                    </span>
                    {isSteelEnabled && (
                      <span className="px-1.5 py-0.2 text-[9px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded border border-amber-200/50 dark:border-amber-800/40">
                        含钢膨
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 ml-auto">
                      {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs font-mono">
                    {record.input.category === 'asphalt' ? (
                      <>
                        <div className="text-slate-500 dark:text-slate-400 font-sans">
                          基准密度: <span className="text-slate-800 dark:text-slate-200 font-mono">{record.input.obsDensity.toFixed(4)} g/cm³</span>
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 text-right font-sans">
                          数量: <span className="text-slate-800 dark:text-slate-200 font-mono">{record.input.volume} {record.input.volumeUnit}</span>
                        </div>

                        <div className="text-slate-500 dark:text-slate-400 font-sans">
                          实测油温: <span className="text-slate-800 dark:text-slate-200 font-mono">{volTempStr}</span>
                        </div>
                        <div className="text-emerald-600 dark:text-emerald-400 font-semibold text-right font-sans">
                          VCF(油品): <span className="font-mono">{(record.result.vcf ?? 1).toFixed(5)}</span>
                          <span className="text-slate-400 font-normal font-mono ml-0.5">({volTempStr})</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-slate-500 dark:text-slate-400 font-sans">
                          视密: <span className="text-slate-800 dark:text-slate-200 font-mono">{record.input.obsDensity.toFixed(4)} g/cm³</span> (@{record.input.obsTemp}°C)
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 text-right font-sans">
                          数量: <span className="text-slate-800 dark:text-slate-200 font-mono">{record.input.volume} {record.input.volumeUnit}</span>
                        </div>

                        <div className="text-indigo-600 dark:text-indigo-400 font-semibold mt-1 font-sans">
                          标密: <span className="font-mono">{record.result.standardDensityG.toFixed(4)} g/cm³</span>
                        </div>
                        <div className="text-emerald-600 dark:text-emerald-400 font-semibold mt-1 text-right font-sans">
                          VCF(油品): <span className="font-mono">{(record.result.vcf ?? 1).toFixed(5)}</span>
                          <span className="text-slate-400 font-normal font-mono ml-0.5">({volTempStr})</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* VCF & Steel Expansion Info Footer */}
                  <div className="border-t border-slate-100 dark:border-slate-800/45 pt-2 mt-2 space-y-1">
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <span className="text-slate-400 dark:text-slate-500">标体: </span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono text-[11px]">
                          {['bbl', 'gal', 'uk_gal', 'lb'].includes(record.input.volumeUnit) 
                            ? `${record.result.barrels.toFixed(2)} bbl` 
                            : `${record.result.standardVolumeM3.toFixed(3)} m³`}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-slate-400 dark:text-slate-500">钢膨系数: </span>
                        {isSteelEnabled ? (
                          <>
                            <span className="text-amber-600 dark:text-amber-400 font-bold font-mono text-[11px]">
                              {(record.result.steelExpansionFactor ?? 1).toFixed(6)}
                            </span>
                            <span className="text-slate-400 dark:text-slate-500 font-mono ml-0.5">
                              ({volTempStr})
                            </span>
                          </>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 font-mono">未启用</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] pt-0.5">
                      {isSteelEnabled ? (
                        <div>
                          <span className="text-slate-400 dark:text-slate-500">综合VCF: </span>
                          <span className="text-indigo-600 dark:text-indigo-400 font-bold font-mono text-[11px]">
                            {(record.result.totalVcf ?? record.result.vcf ?? 1).toFixed(5)}
                          </span>
                        </div>
                      ) : (
                        <div className="text-slate-400 text-[9.5px]">无钢热膨胀修正</div>
                      )}
                      <div>
                        <span className="text-slate-400 dark:text-slate-500">API度: </span>
                        <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">
                          {(record.result.apiGravity ?? 0).toFixed(1)}°
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 ml-2">
                  <button
                    onClick={() => onReloadRecord(record)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors cursor-pointer"
                    title="重新载入数据"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteRecord(record.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
                    title="删除记录"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
