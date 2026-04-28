"use client";

import React from 'react';
import { 
  LayoutDashboard, 
  Building2, 
  Briefcase, 
  CheckSquare, 
  BarChart3, 
  Cpu, 
  MessageSquare, 
  Settings,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Target
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const MENU_ITEMS = [
  { group: 'HOME', items: [
    { id: 'dashboard', label: 'Painel Unificado', icon: LayoutDashboard, href: '/' },
  ]},
  { group: 'CRM', items: [
    { id: 'empresas', label: 'Empresas', icon: Building2, href: '/empresas' },
    { id: 'negocios', label: 'Negócios', icon: Briefcase, href: '/negocios' },
    { id: 'atividades', label: 'Atividades', icon: CheckSquare, href: '/atividades' },
    { id: 'ticket', label: 'Estratégia', icon: Target, href: '/ticket' },
  ]},
  { group: 'IA & INSIGHTS', items: [
    { id: 'agentes', label: 'Agentes Live', icon: Cpu, href: '/agentes' },
    { id: 'forecast', label: 'Forecast IA', icon: TrendingUp, href: '/forecast' },
  ]},
];

interface SidebarProps {
  isOpen: boolean;
  toggle: () => void;
}

export function Sidebar({ isOpen, toggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={cn(
      "relative h-full bg-unifique-side text-slate-300 transition-all duration-300 border-r border-white/5 flex flex-col",
      isOpen ? "w-64" : "w-20"
    )}>
      {/* Logo Area */}
      <div className="p-6 flex items-center justify-between">
        {isOpen ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-unifique-primary rounded-lg flex items-center justify-center font-bold text-white">U</div>
            <span className="font-bold text-white text-xl tracking-tight">unifique</span>
          </div>
        ) : (
          <div className="w-8 h-8 bg-unifique-primary rounded-lg flex items-center justify-center font-bold text-white mx-auto">U</div>
        )}
      </div>

      {/* Toggle Button */}
      <button 
        onClick={toggle}
        className="absolute -right-3 top-20 bg-unifique-primary text-white rounded-full p-1 shadow-lg border-2 border-unifique-side"
      >
        {isOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-6 mt-4">
        {MENU_ITEMS.map((group) => (
          <div key={group.group} className="space-y-1">
            {isOpen && <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{group.group}</p>}
            {group.items.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link 
                  key={item.id} 
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group",
                    isActive 
                      ? "bg-unifique-primary/10 text-unifique-cyan" 
                      : "hover:bg-white/5 hover:text-white"
                  )}
                >
                  <Icon size={20} className={cn(isActive ? "text-unifique-cyan" : "text-slate-400 group-hover:text-white")} />
                  {isOpen && <span className="text-sm font-medium">{item.label}</span>}
                  {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-unifique-cyan shadow-[0_0_8px_rgba(0,200,240,0.6)]" />}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-white/5">
        <div className={cn("flex items-center gap-3", !isOpen && "justify-center")}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-unifique-primary to-unifique-cyan flex items-center justify-center text-xs font-bold text-white">TA</div>
          {isOpen && (
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">Tadeu Alves</p>
              <p className="text-[10px] text-slate-500 truncate">Admin · Unifique</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
