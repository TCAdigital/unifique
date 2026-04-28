"use client";

import React from 'react';
import { Shell } from '@/components/layout/Shell';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  BarChart3,
  PieChart,
  Calendar
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function TiVendasPage() {
  const stats = [
    { label: 'Receita Bruta (ROB)', value: 450200, trend: '+14%', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Receita Líquida (ROL)', value: 382600, trend: '+12%', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
    { label: 'Lucro Líquido (LL)', value: 125400, trend: '+18%', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Margem Líquida', value: '32.7%', trend: '+2.4%', color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  return (
    <Shell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-outfit text-slate-900 dark:text-white">Faturamento & Vendas TI</h1>
            <p className="text-sm text-slate-500">Relatórios financeiros e análise de rentabilidade TIC.</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-unifique-primary text-white rounded-xl font-bold shadow-lg shadow-unifique-primary/20 hover:scale-[1.02] transition-all text-sm">
            <Calendar size={18} />
            Periodo: Abril 2025
          </button>
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
                <div className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 bg-slate-100 dark:bg-white/10 rounded-full text-emerald-500">
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

        {/* Chart Section Placeholder */}
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
            
            <div className="flex-1 flex items-end gap-2 pb-2">
              {[60, 45, 80, 55, 90, 75, 100, 65, 85, 40, 70, 95].map((h, i) => (
                <div key={i} className="flex-1 group relative">
                  <div 
                    className="w-full bg-slate-100 dark:bg-white/5 rounded-t-lg transition-all group-hover:bg-unifique-primary/40" 
                    style={{ height: `${h}%` }}
                  >
                    <div className="absolute bottom-0 w-full bg-unifique-primary rounded-t-lg opacity-80" style={{ height: `${h * 0.7}%` }} />
                  </div>
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] font-bold text-slate-400">M{i+1}</div>
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
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tighter">{item.label}</span>
                    <span className="text-xs font-bold">{item.value}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
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
