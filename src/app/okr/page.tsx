"use client";

import React from 'react';
import { Shell } from '@/components/layout/Shell';
import { 
  Target, 
  TrendingUp, 
  Flag, 
  CheckCircle2, 
  BarChart2, 
  Users,
  ChevronRight,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const OKRS = [
  { 
    id: 1, 
    objetivo: "Liderança em TIC no Sul", 
    progresso: 68, 
    dono: "Diretoria Comercial",
    kr: [
      { titulo: "Faturar R$ 2M em serviços Cloud", atual: 1.4, meta: 2.0, pct: 70 },
      { titulo: "Atingir 95% de satisfação (NPS)", atual: 88, meta: 95, pct: 92 },
    ]
  },
  { 
    id: 2, 
    objetivo: "Eficiência Operacional IA", 
    progresso: 45, 
    dono: "TI & Inovação",
    kr: [
      { titulo: "Automatizar 60% da qualificação SDR", atual: 25, meta: 60, pct: 41 },
      { titulo: "Reduzir ciclo de venda em 10 dias", atual: 3, meta: 10, pct: 30 },
    ]
  }
];

export default function OkrPage() {
  return (
    <Shell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-outfit text-slate-900 dark:text-white">OKR & Metas Estratégicas</h1>
            <p className="text-sm text-slate-500">Acompanhamento de Objetivos e Resultados-Chave (Q2 2025).</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-unifique-primary text-white rounded-xl font-bold shadow-lg shadow-unifique-primary/20 hover:scale-[1.02] transition-all">
            <Plus size={18} />
            Novo Objetivo
          </button>
        </div>

        {/* OKR Cards */}
        <div className="grid grid-cols-1 gap-8">
          {OKRS.map((okr, idx) => (
            <motion.div 
              key={okr.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="glass-card overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-unifique-primary/10 flex items-center justify-center text-unifique-primary">
                    <Target size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">{okr.objetivo}</h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{okr.dono}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Progresso Geral</p>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-unifique-primary rounded-full" 
                          initial={{ width: 0 }}
                          animate={{ width: `${okr.progresso}%` }}
                          transition={{ duration: 1.5 }}
                        />
                      </div>
                      <span className="text-sm font-bold text-unifique-primary">{okr.progresso}%</span>
                    </div>
                  </div>
                  <button className="p-2 text-slate-400 hover:text-unifique-primary transition-colors">
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white dark:bg-transparent">
                {okr.kr.map((kr, kidx) => (
                  <div key={kidx} className="p-4 rounded-xl border border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-unifique-cyan" />
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">{kr.titulo}</h3>
                      </div>
                      <span className="text-[10px] font-bold text-unifique-cyan">{kr.pct}%</span>
                    </div>
                    
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden mb-3">
                      <motion.div 
                        className="h-full bg-unifique-cyan rounded-full" 
                        initial={{ width: 0 }}
                        animate={{ width: `${kr.pct}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                      <span>Atual: {kr.atual}</span>
                      <span className="text-slate-500">Meta: {kr.meta}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Meta Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Objetivos em Dia', value: '85%', icon: CheckCircle2, color: 'text-emerald-500' },
            { label: 'Time Performance', value: 'A+', icon: Users, color: 'text-unifique-primary' },
            { label: 'KRs Completados', value: '14/22', icon: BarChart2, color: 'text-blue-500' },
          ].map((stat, i) => (
            <div key={i} className="glass-card p-6 flex items-center gap-4">
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center bg-slate-50 dark:bg-white/5", stat.color)}>
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{stat.label}</p>
                <p className="text-xl font-bold">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}
