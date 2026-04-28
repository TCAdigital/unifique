"use client";

import React from 'react';
import { Shell } from '@/components/layout/Shell';
import { 
  Target, 
  TrendingUp, 
  Users, 
  Clock, 
  BarChart3,
  Award,
  ArrowUpRight,
  ChevronRight
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function EstrategiaPage() {
  const metrics = [
    { label: 'Ticket Médio', value: 84500, trend: '+12%', icon: Target, color: 'text-unifique-primary', bg: 'bg-unifique-primary/10' },
    { label: 'Ciclo de Vendas', value: '42 dias', trend: '-5 dias', icon: Clock, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'CAC (Custo Lead)', value: 1250, trend: '-8%', icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'LTV Projetado', value: 320000, trend: '+15%', icon: Award, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ];

  return (
    <Shell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-outfit text-slate-900 dark:text-white">Estratégia & Ticket Médio</h1>
            <p className="text-sm text-slate-500">Métricas de performance e eficiência comercial.</p>
          </div>
        </div>

        {/* Strategy KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={cn("p-2 rounded-xl", m.bg, m.color)}>
                  <m.icon size={20} />
                </div>
                <div className="text-[10px] font-bold px-2 py-1 bg-slate-100 dark:bg-white/10 rounded-full text-unifique-primary">
                  {m.trend}
                </div>
              </div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{m.label}</p>
              <h3 className="text-2xl font-bold mt-1 font-outfit">
                {typeof m.value === 'number' ? formatCurrency(m.value) : m.value}
              </h3>
            </motion.div>
          ))}
        </div>

        {/* Strategy Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-card p-6">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
              <BarChart3 size={20} className="text-unifique-primary" />
              Distribuição de Ticket por Segmento
            </h2>
            <div className="space-y-6">
              {[
                { label: 'Setor Industrial', value: 120000, pct: 85, color: 'bg-unifique-primary' },
                { label: 'Varejo / Serviços', value: 45000, pct: 40, color: 'bg-cyan-400' },
                { label: 'Governo / Público', value: 210000, pct: 100, color: 'bg-indigo-500' },
                { label: 'Educação', value: 32000, pct: 25, color: 'bg-emerald-400' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{item.label}</span>
                    <span className="text-xs font-bold">{formatCurrency(item.value)}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      className={cn("h-full rounded-full", item.color)} 
                      initial={{ width: 0 }}
                      animate={{ width: `${item.pct}%` }}
                      transition={{ duration: 1.5 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6 bg-gradient-to-br from-unifique-primary to-blue-700 text-white border-none">
            <h3 className="font-bold text-lg mb-4">Análise Estratégica</h3>
            <div className="space-y-4">
              <div className="p-3 bg-white/10 rounded-xl border border-white/10">
                <p className="text-[10px] font-bold text-white/60 uppercase mb-1">Oportunidade</p>
                <p className="text-xs leading-relaxed">
                  Focar em **Governo** pode elevar o Ticket Médio em até **45%** no próximo trimestre.
                </p>
              </div>
              <div className="p-3 bg-white/10 rounded-xl border border-white/10">
                <p className="text-[10px] font-bold text-white/60 uppercase mb-1">Risco</p>
                <p className="text-xs leading-relaxed">
                  Ciclo de vendas no **Varejo** está acima da média de 30 dias. Recomendado automação de propostas.
                </p>
              </div>
            </div>
            <button className="w-full mt-6 py-3 bg-white text-unifique-primary rounded-xl text-xs font-bold shadow-lg flex items-center justify-center gap-2">
              Baixar Relatório Completo
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </Shell>
  );
}
