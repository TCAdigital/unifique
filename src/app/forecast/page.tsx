"use client";

import React, { useState, useEffect } from 'react';
import { Shell } from '@/components/layout/Shell';
import {
  TrendingUp,
  Target,
  BarChart3,
  Zap,
  ArrowUpRight,
  AlertCircle,
  BrainCircuit,
  Loader2,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import type { Negocio } from '@/types';

const FASE_ORDER = ['Prospecção', 'Qualificação', 'Proposta', 'Negociação', 'Fechamento', 'Contrato'];
const FASE_COLORS: Record<string, string> = {
  'Prospecção': 'bg-slate-400',
  'Qualificação': 'bg-blue-400',
  'Proposta': 'bg-amber-400',
  'Negociação': 'bg-indigo-400',
  'Fechamento': 'bg-emerald-500',
  'Contrato': 'bg-purple-500',
};

const CENARIO_DELTA: Record<string, number> = {
  otimista: 0.20,
  realista: 0,
  pessimista: -0.20,
};

interface ForecastData {
  valor: number;
  confianca: number;
  pipeline: number;
  negocios: number;
}

interface FunilItem {
  fase: string;
  total: number;
  ponderado: number;
  count: number;
  pct: number;
}

export default function ForecastPage() {
  const [cenario, setCenario] = useState<'realista' | 'otimista' | 'pessimista'>('realista');
  const [loading, setLoading] = useState(true);
  const [negocios, setNegocios] = useState<Negocio[]>([]);

  useEffect(() => {
    supabase
      .from('negocios')
      .select('*, empresas(nome)')
      .order('valor', { ascending: false })
      .then(({ data }) => {
        setNegocios((data as Negocio[]) ?? []);
        setLoading(false);
      });
  }, []);

  function calcForecast(cenario: 'realista' | 'otimista' | 'pessimista'): ForecastData {
    const delta = CENARIO_DELTA[cenario];
    const ativos = negocios.filter(n => n.fase !== 'Contrato');
    const valor = ativos.reduce((sum, n) => {
      const prob = Math.min(Math.max((n.probabilidade / 100) + delta, 0), 1);
      return sum + n.valor * prob;
    }, 0);
    const pipeline = ativos.reduce((s, n) => s + n.valor, 0);
    const confianca = ativos.length > 0
      ? Math.round(ativos.reduce((s, n) => s + n.probabilidade, 0) / ativos.length)
      : 0;
    return { valor, confianca, pipeline, negocios: ativos.length };
  }

  function calcFunil(): FunilItem[] {
    return FASE_ORDER.map(fase => {
      const itens = negocios.filter(n => n.fase === fase);
      const total = itens.reduce((s, n) => s + n.valor, 0);
      const ponderado = itens.reduce((s, n) => s + n.valor * (n.probabilidade / 100), 0);
      return { fase, total, ponderado, count: itens.length, pct: itens.length };
    }).filter(f => f.count > 0);
  }

  const forecast = calcForecast(cenario);
  const funil = calcFunil();
  const maxTotal = Math.max(...funil.map(f => f.total), 1);

  const cenarioLabels = {
    otimista: { diff: '+20% prob.', color: 'text-emerald-500' },
    realista: { diff: 'Prob. atual', color: 'text-blue-500' },
    pessimista: { diff: '-20% prob.', color: 'text-red-400' },
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
              <h1 className="text-2xl font-bold font-outfit text-slate-900">Forecast Predictor IA</h1>
              <p className="text-sm text-slate-500">Projeção baseada nas probabilidades reais do pipeline ativo.</p>
            </div>
          </div>
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            {(['otimista', 'realista', 'pessimista'] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCenario(c)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                  cenario === c
                    ? "bg-unifique-primary text-white shadow-lg"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={32} className="animate-spin text-unifique-primary" />
          </div>
        ) : (
          <>
            {/* Main KPI */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div
                className="lg:col-span-2 p-8 text-white rounded-[0.875rem] shadow-lg relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #001840 0%, #002E6D 100%)' }}
              >
                <div className="absolute -right-10 -bottom-10 opacity-5">
                  <TrendingUp size={300} />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-6">
                    <Zap size={16} className="text-unifique-cyan animate-pulse" />
                    <span className="text-xs font-bold text-unifique-cyan uppercase tracking-[0.2em]">
                      Pipeline Ativo — {forecast.negocios} negócios
                    </span>
                  </div>
                  <div className="flex flex-col md:flex-row md:items-end gap-6">
                    <div>
                      <motion.h2
                        key={cenario}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl font-bold font-outfit mb-2 tracking-tight"
                      >
                        {formatCurrency(forecast.valor)}
                      </motion.h2>
                      <p className="text-slate-400 text-sm">Valor total ponderado pelas probabilidades</p>
                    </div>
                    <div className="flex flex-col gap-2 pb-2">
                      <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10 w-fit">
                        <ArrowUpRight size={14} className="text-unifique-cyan" />
                        <span className="text-xs font-bold">{cenarioLabels[cenario].diff}</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10 w-fit">
                        <Target size={14} className="text-unifique-success" />
                        <span className="text-xs font-bold">{forecast.confianca}% Confiança média</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-card p-6 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                    <AlertCircle size={16} className="text-unifique-cyan" />
                    Resumo do Pipeline
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Pipeline total</span>
                      <span className="font-bold text-slate-900">{formatCurrency(forecast.pipeline)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Negócios ativos</span>
                      <span className="font-bold text-slate-900">{forecast.negocios}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Forecast ({cenario})</span>
                      <span className="font-bold text-unifique-primary">{formatCurrency(forecast.valor)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Taxa de conversão</span>
                      <span className="font-bold text-unifique-success">
                        {forecast.pipeline > 0 ? Math.round((forecast.valor / forecast.pipeline) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-400">Qualidade do Pipeline</span>
                    <span className={cn("text-xs font-bold", forecast.confianca >= 70 ? "text-unifique-success" : forecast.confianca >= 50 ? "text-amber-500" : "text-red-500")}>
                      {forecast.confianca >= 70 ? 'Boa' : forecast.confianca >= 50 ? 'Regular' : 'Fraca'}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-unifique-success rounded-full transition-all duration-700" style={{ width: `${forecast.confianca}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Funnel */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-card p-6">
                <h3 className="font-bold text-sm mb-6 flex items-center gap-2 uppercase tracking-widest text-slate-400">
                  <BarChart3 size={16} />
                  Funil por Fase — Valores Reais
                </h3>
                {funil.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">Nenhum negócio no pipeline.</p>
                ) : (
                  <div className="space-y-5">
                    {funil.map((item) => (
                      <div key={item.fase}>
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <div className={cn("w-2 h-2 rounded-full", FASE_COLORS[item.fase] ?? 'bg-slate-400')} />
                            <span className="text-xs font-bold text-slate-700">{item.fase}</span>
                            <span className="text-[10px] text-slate-400">({item.count})</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-slate-900 block">{formatCurrency(item.total)}</span>
                            <span className="text-[10px] text-unifique-primary font-bold">
                              {formatCurrency(item.ponderado)} pond.
                            </span>
                          </div>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <motion.div
                            className={cn("h-full rounded-full", FASE_COLORS[item.fase] ?? 'bg-slate-400')}
                            initial={{ width: 0 }}
                            animate={{ width: `${(item.total / maxTotal) * 100}%` }}
                            transition={{ duration: 0.8, delay: 0.1 }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top negócios */}
              <div className="glass-card p-6">
                <h3 className="font-bold text-sm mb-6 flex items-center gap-2 uppercase tracking-widest text-slate-400">
                  <TrendingUp size={16} />
                  Maiores Oportunidades
                </h3>
                {negocios.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">Nenhum negócio cadastrado.</p>
                ) : (
                  <div className="space-y-3">
                    {negocios.slice(0, 5).map((n) => {
                      const delta = CENARIO_DELTA[cenario];
                      const prob = Math.min(Math.max(n.probabilidade + delta * 100, 0), 100);
                      return (
                        <div key={n.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-unifique-primary to-unifique-cyan flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                            {n.empresas?.nome?.slice(0, 2).toUpperCase() ?? '??'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate text-slate-900">{n.nome}</p>
                            <p className="text-[10px] text-slate-500 truncate">{n.empresas?.nome ?? '—'} · {n.fase}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs font-bold text-unifique-primary">{formatCurrency(n.valor * (prob / 100))}</p>
                            <div className="flex items-center gap-1 justify-end">
                              <div className={cn("w-1.5 h-1.5 rounded-full", prob >= 70 ? "bg-unifique-success" : prob >= 50 ? "bg-amber-400" : "bg-red-500")} />
                              <span className="text-[10px] font-bold text-slate-500">{Math.round(prob)}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </Shell>
  );
}
