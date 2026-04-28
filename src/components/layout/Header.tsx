"use client";

import React from 'react';
import { Search, Bell, Moon, Sun, HelpCircle } from 'lucide-react';

export function Header() {
  return (
    <header className="h-16 glass-nav flex items-center justify-between px-6 z-10">
      {/* Search Bar */}
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-unifique-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Buscar empresas, negócios, leads..."
            className="w-full bg-slate-100 dark:bg-white/5 border border-transparent focus:border-unifique-primary/30 focus:bg-white dark:focus:bg-white/10 rounded-xl py-2 pl-10 pr-4 text-sm transition-all outline-none"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 ml-4">
        <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-all relative">
          <Bell size={19} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-unifique-side"></span>
        </button>
        
        <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-all">
          <Sun size={19} className="hidden dark:block" />
          <Moon size={19} className="block dark:hidden" />
        </button>

        <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-all">
          <HelpCircle size={19} />
        </button>

        <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-2" />

        <div className="flex items-center gap-3 pl-2">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-900 dark:text-white">Rede Unifique</p>
            <p className="text-[10px] text-slate-500">Unidade Corporate</p>
          </div>
        </div>
      </div>
    </header>
  );
}
