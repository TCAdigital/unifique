"use client";

import React from "react";
import { Search, Bell, HelpCircle } from "lucide-react";

export function Header() {
  return (
    <header className="h-16 glass-nav flex items-center justify-between px-6 z-10 flex-shrink-0">
      {/* Search */}
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-unifique-text-muted group-focus-within:text-unifique-primary transition-colors"
          />
          <input
            type="text"
            placeholder="Buscar empresas, negócios, leads..."
            className="w-full bg-unifique-bg border border-unifique-border-light focus:border-unifique-border focus:bg-white rounded-xl py-2 pl-9 pr-4 text-sm text-unifique-dark placeholder:text-unifique-text-muted transition-all outline-none focus:ring-2 focus:ring-unifique-primary/15"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 ml-4">
        <button className="relative p-2 text-unifique-text-sec hover:bg-unifique-bg rounded-lg transition-all">
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-unifique-danger rounded-full border-2 border-white" />
        </button>

        <button className="p-2 text-unifique-text-sec hover:bg-unifique-bg rounded-lg transition-all">
          <HelpCircle size={18} />
        </button>

        <div className="w-px h-6 bg-unifique-border-light mx-2" />

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-unifique-dark">Rede Unifique</p>
            <p className="text-[10px] text-unifique-text-muted">Unidade Corporate</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-unifique-primary to-unifique-cyan flex items-center justify-center text-xs font-bold text-white shadow-sm">
            TA
          </div>
        </div>
      </div>
    </header>
  );
}
