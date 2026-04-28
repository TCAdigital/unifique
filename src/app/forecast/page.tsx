"use client";

import React, { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { 
  TrendingUp, 
  Target, 
  BarChart3, 
  Zap, 
  ArrowUpRight, 
  AlertCircle,
  BrainCircuit,
  ChevronDown
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function ForecastPage() {
  const [cenario, setCenario] = useState<'realista' | 'otimista' | 'pessimista'>('realista');

  const data = {
    realista: { valor: 628400, prob: 72, diff: '+8.4%' },
    otimista: { valor: 845000, prob: 88, diff: '+22.1%' },
    pessimista: { valor: 412000, prob: 55, diff: '-12.5%' },
  };

  return (
    <Shell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-unifique-cyan/10 flex items-center justify-center text-unifique-cyan">
              <BrainCircuit size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-outfit text-slate-900 dark:text-white">Forecast Predictor IA</h1>
              <p className="text-sm text-slate-500">Análise preditiva baseada em probabilidade e engajamento histórico.</p>
            </div>
          </div>
          <div className="flex bg-white dark:bg-white/5 p-1 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
            {(['otimista', 'realista', 'pessimista'] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCenario(c)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                  cenario === c 
                    ? "bg-unifique-primary text-white shadow-lg" 
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Forecast KPI Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-card p-8 bg-gradient-to-br from-unifique-side to-unifique-dark text-white border-none relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 opacity-5">
              <TrendingUp size={300} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <Zap size={16} className="text-unifique-cyan animate-pulse" />
                <span className="text-xs font-bold text-unifique-cyan uppercase tracking-[0.2em]">Estimativa IA Q2 2025</span>
              </div>
              <div className="flex flex-col md:flex-row md:items-end gap-6">
                <div>
                  <h2 className="text-5xl font-bold font-outfit mb-2 tracking-tight">
                    {formatCurrency(data[cenario].valor)}
                  </h2>
                  <p className="text-slate-400 text-sm">Valor total ponderado pelo score de engajamento</p>
                </div>
                <div className="flex flex-col gap-2 pb-2">
                  <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10 w-fit">
                    <ArrowUpRight size={14} className="text-unifique-cyan" />
                    <span className="text-xs font-bold">{data[cenario].diff} vs Q1</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10 w-fit">
                    <Target size={14} className="text-unifique-success" />
                    <span className="text-xs font-bold">{data[cenario].prob}% Confiança</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                <AlertCircle size={16} className="text-unifique-cyan" />
                Insight do Algoritmo
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed italic">
                "O cenário **{cenario}** considera um aumento de 15% na velocidade do ciclo de vendas para o setor industrial e uma redução de churn na fase de proposta."
              </p>
            </div>
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-white/5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-400">Qualidade do Pipeline</span>
                <span className="text-xs font-bold text-unifique-success">A+ (Excelente)</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-unifique-success w-[85%] rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Funnel & Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <h3 className="font-bold text-sm mb-6 flex items-center gap-2 uppercase tracking-widest text-slate-400">
              <BarChart3 size={16} />
              Conversão de Funil Esperada
            </h3>
            <div className="space-y-6">
              {[
                { stage: 'Prospecção', valor: 920000, prob: '15%', h: 'w-full', color: 'bg-slate-400' },
                { stage: 'Qualificação', valor: 650000, prob: '35%', h: 'w-[75%]', color: 'bg-blue-400' },
                { stage: 'Proposta', valor: 420000, prob: '60%', h: 'w-[50%]', color: 'bg-amber-400' },
                { stage: 'Fechamento', valor: 180000, prob: '90%', h: 'w-[25%]', color: 'bg-emerald-500' },
              ].map((item) => (
                <div key={item.stage} className="relative">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold">{item.stage}</span>
                    <div className="text-right">
                      <span className="text-xs font-bold block">{formatCurrency(item.valor)}</span>
                      <span className="text-[10px] text-slate-500 font-bold">{item.prob} prob.</span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      className={cn("h-full rounded-full", item.color)} 
                      initial={{ width: 0 }}
                      animate={{ width: item.h.replace('w-[', '').replace('%]', '') + '%' }}
                      transition={{ duration: 1, delay: 0.2 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="font-bold text-sm mb-6 flex items-center gap-2 uppercase tracking-widest text-slate-400">
              <TrendingUp size={16} />
              Probabilidade por Consultor
            </h3>
            <div className="space-y-4">
              {[
                { name: 'Maria Souza', forecast: 245000, prob: 82, deals: 5 },
                { name: 'João Silva', forecast: 182000, prob: 65, deals: 4 },
                { name: 'Ana Paula', forecast: 115000, prob: 78, deals: 3 },
                { name: 'Carlos Lima', forecast: 86000, prob: 45, deals: 6 },
              ].map((c, i) => (
                <div key={i} className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-unifique-primary to-unifique-cyan flex items-center justify-center text-xs font-bold text-white">
                    {c.name.split(' ').map(x => x[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{c.name}</p>
                    <p className="text-[10px] text-slate-500">{c.deals} deals ativos</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-unifique-primary">{formatCurrency(c.forecast)}</p>
                    <div className="flex items-center gap-1 justify-end">
                      <div className={cn("w-1.5 h-1.5 rounded-full", c.prob >= 70 ? "bg-unifique-success" : c.prob >= 50 ? "bg-amber-400" : "bg-red-500")} />
                      <span className="text-[10px] font-bold text-slate-500">{c.prob}%</span>
                    </div>
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
