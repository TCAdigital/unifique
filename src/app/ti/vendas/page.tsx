"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Shell } from '@/components/layout/Shell';
import {
  DollarSign,
  ArrowUpRight,
  BarChart3,
  PieChart,
  Calendar,
  ChevronDown,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';

function generatePeriods(): { label: string; value: string }[] {
  const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const result = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({
      label: `${MESES[d.getMonth()]} ${d.getFullYear()}`,
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
    });
  }
  return result;
}

const PERIODS = generatePeriods();

const STATS_BY_PERIOD: Record<string, {
  rob: number; rol: number; ll: number; margem: string;
}> = {
  [PERIODS[0].value]: { rob: 462800, rol: 393400, ll: 131200, margem: '33.3%' },
  [PERIODS[1].value]: { rob: 450200, rol: 382600, ll: 125400, margem: '32.7%' },
  [PERIODS[2].value]: { rob: 438100, rol: 371900, ll: 119800, margem: '32.2%' },
  [PERIODS[3].value]: { rob: 421500, rol: 358200, ll: 112600, margem: '31.4%' },
  [PERIODS[4].value]: { rob: 408300, rol: 346500, ll: 107900, margem: '31.1%' },
  [PERIODS[5].value]: { rob: 395700, rol: 335900, ll: 103200, margem: '30.7%' },
};

export default function TiVendasPage() {
  const [period, setPeriod] = useState(PERIODS[0].value);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showDropdown) return;
    function close(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [showDropdown]);

  const currentPeriodLabel = PERIODS.find(p => p.value === period)?.label ?? '';
  const data = STATS_BY_PERIOD[period] ?? STATS_BY_PERIOD[PERIODS[1].value];

  const stats = [
    { label: 'Receita Bruta (ROB)', value: data.rob, trend: '+14%', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Receita Líquida (ROL)', value: data.rol, trend: '+12%', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
    { label: 'Lucro Líquido (LL)', value: data.ll, trend: '+18%', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Margem Líquida', value: data.margem, trend: '+2.4%', color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  return (
    <Shell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-outfit text-slate-900">Faturamento &amp; Vendas TI</h1>
            <p className="text-sm text-slate-500">Relatórios financeiros e análise de rentabilidade TIC.</p>
          </div>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(v => !v)}
              className="flex items-center gap-2 px-4 py-2 bg-unifique-primary text-white rounded-xl font-bold shadow-lg shadow-unifique-primary/20 hover:scale-[1.02] transition-all text-sm"
            >
              <Calendar size={16} />
              Período: {currentPeriodLabel}
              <ChevronDown size={14} className={cn("transition-transform", showDropdown && "rotate-180")} />
            </button>
            {showDropdown && (
              <div className="absolute right-0 top-11 z-20 w-52 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                {PERIODS.map(p => (
                  <button
                    key={p.value}
                    onClick={() => { setPeriod(p.value); setShowDropdown(false); }}
                    className={cn(
                      "w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-slate-50 transition-all",
                      period === p.value ? "text-unifique-primary font-bold bg-unifique-primary/5" : "text-slate-700"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Financial KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={cn("p-2 rounded-xl", stat.bg, stat.color)}>
                  <DollarSign size={20} />
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 bg-slate-100 rounded-full text-emerald-500">
                  <ArrowUpRight size={10} />
                  {stat.trend}
                </div>
              </div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-2xl font-bold mt-1 font-outfit">
                {typeof stat.value === 'number' ? formatCurrency(stat.value) : stat.value}
              </h3>
            </motion.div>
          ))}
        </div>

        {/* Chart Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-card p-6 min-h-[350px] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <BarChart3 size={20} className="text-unifique-primary" />
                Evolução de Receita vs Custos
              </h2>
              <div className="flex gap-2">
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-unifique-primary" /><span className="text-[10px] font-bold text-slate-500">ROB</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-400" /><span className="text-[10px] font-bold text-slate-500">CUSTOS</span></div>
              </div>
            </div>

            <div className="flex-1 flex items-end gap-2 pb-6">
              {[60, 45, 80, 55, 90, 75, 100, 65, 85, 40, 70, 95].map((h, i) => (
                <div key={i} className="flex-1 group relative">
                  <div
                    className="w-full bg-slate-100 rounded-t-lg transition-all group-hover:bg-unifique-primary/40"
                    style={{ height: `${h * 2.8}px` }}
                  >
                    <div className="absolute bottom-0 w-full bg-unifique-primary rounded-t-lg opacity-80" style={{ height: `${h * 1.96}px` }} />
                  </div>
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] font-bold text-slate-400">M{i + 1}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
              <PieChart size={20} className="text-unifique-primary" />
              Mix de Produtos
            </h2>
            <div className="space-y-6">
              {[
                { label: 'Hardware', value: '45%', color: 'bg-blue-500' },
                { label: 'Software/SaaS', value: '30%', color: 'bg-cyan-400' },
                { label: 'Serviços/Suporte', value: '15%', color: 'bg-emerald-400' },
                { label: 'Infraestrutura', value: '10%', color: 'bg-indigo-400' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-tighter">{item.label}</span>
                    <span className="text-xs font-bold">{item.value}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full", item.color)} style={{ width: item.value }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
