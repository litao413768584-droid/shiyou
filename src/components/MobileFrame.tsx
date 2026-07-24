/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Zap, Sun, Moon } from 'lucide-react';

interface MobileFrameProps {
  children: React.ReactNode;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export default function MobileFrame({ children, theme, onToggleTheme }: MobileFrameProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      <div className="max-w-2xl mx-auto min-h-screen flex flex-col bg-white dark:bg-slate-900 border-x border-slate-200/60 dark:border-slate-800/60 shadow-xs">
        {/* App Header */}
        <header className="bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white py-3 px-4 sm:px-6 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between z-40 shrink-0 sticky top-0 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center border border-amber-500/20">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                沥青/石油密度体积智算
              </h1>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono tracking-tight font-medium uppercase">
                ASTM D1250 / GB/T 1885 标准
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/80 px-2 py-0.5 rounded-full font-mono flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              完全离线
            </span>
            <button
              onClick={onToggleTheme}
              className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center border border-slate-200/60 dark:border-slate-800"
              title={theme === 'light' ? '切换为深色模式' : '切换为浅色模式'}
              aria-label="Toggle dark mode"
              id="top-theme-toggle"
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 text-slate-600" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 bg-[#fafafa] dark:bg-slate-900/50">
          {children}
        </main>
      </div>
    </div>
  );
}

