"use client";

import React, { useEffect, useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { supabase } from '@/lib/supabase';
import { Negocio } from '@/types';
import { 
  Plus, 
  Search, 
  Briefcase, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  ChevronRight,
  Filter,
  LayoutGrid,
  List as ListIcon
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const FASES = [
  { id: 'Prospecção', color: 'bg-slate-400' },
  { id: 'Qualificação', color: 'bg-blue-400' },
  { id: 'Proposta', color: 'bg-amber-400' },
  { id: 'Negociação', color: 'bg-indigo-400' },
  { id: 'Fechamento', color: 'bg-emerald-500' }
];

export default function NegociosPage() {
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'kanban' | 'list'>('kanban');

  useEffect(() => {
    async function fetchNegocios() {
      const { data, error } = await supabase
        .from('negocios')
        .select('*, empresas(nome)')
        .order('valor', { ascending: false });

      if (data) setNegocios(data as any);
      setLoading(false);
    }
    fetchNegocios();
  }, []);

  return (
    <Shell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-outfit text-slate-900 dark:text-white">Pipeline de Negócios</h1>
            <p className="text-sm text-slate-500">Acompanhe o progresso das oportunidades comerciais.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-1 flex gap-1">
              <button 
                onClick={() => setView('kanban')}
                className={cn("p-1.5 rounded-lg transition-all", view === 'kanban' ? "bg-unifique-primary text-white shadow-sm" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5")}
              >
                <LayoutGrid size={18} />
              </button>
              <button 
                onClick={() => setView('list')}
                className={cn("p-1.5 rounded-lg transition-all", view === 'list' ? "bg-unifique-primary text-white shadow-sm" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5")}
              >
                <ListIcon size={18} />
              </button>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-unifique-primary text-white rounded-xl font-bold shadow-lg shadow-unifique-primary/20 hover:scale-[1.02] transition-all">
              <Plus size={18} />
              Novo Negócio
            </button>
          </div>
        </div>

        {/* Kanban View */}
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-4">
            <div className="w-8 h-8 border-4 border-unifique-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-500 animate-pulse font-medium">Sincronizando pipeline...</p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-6 -mx-4 px-4 min-h-[600px]">
            {FASES.map((fase) => {
              const negociosNaFase = negocios.filter(n => n.fase === fase.id);
              const totalValor = negociosNaFase.reduce((acc, n) => acc + n.valor, 0);

              return (
                <div key={fase.id} className="flex-shrink-0 w-80 flex flex-col gap-4">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", fase.color)} />
                      <h2 className="font-bold text-sm text-slate-700 dark:text-slate-200 uppercase tracking-wider">{fase.id}</h2>
                      <span className="bg-slate-200 dark:bg-white/10 text-[10px] font-bold px-2 py-0.5 rounded-full text-slate-500">
                        {negociosNaFase.length}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">{formatCurrency(totalValor)}</span>
                  </div>

                  <div className="flex-1 space-y-3 p-2 bg-slate-100/50 dark:bg-white/5 rounded-2xl border border-dashed border-slate-300 dark:border-white/10">
                    <AnimatePresence>
                      {negociosNaFase.map((negocio, idx) => (
                        <motion.div
                          key={negocio.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          layout
                          className="glass-card p-4 hover:border-unifique-primary/50 cursor-grab active:cursor-grabbing group transition-all"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-bold text-unifique-primary uppercase tracking-tight">
                              {negocio.empresas?.nome || 'Empresa desconhecida'}
                            </span>
                            <div className="w-2 h-2 rounded-full bg-unifique-success" />
                          </div>
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3 group-hover:text-unifique-primary transition-colors">
                            {negocio.nome}
                          </h3>
                          
                          <div className="flex items-center justify-between mt-4">
                            <div>
                              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Valor</p>
                              <p className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(negocio.valor)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Prob.</p>
                              <p className="text-sm font-bold text-unifique-success">{negocio.probabilidade}%</p>
                            </div>
                          </div>

                          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                            <div className="flex -space-x-2">
                              <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-white/10 border-2 border-white dark:border-unifique-side flex items-center justify-center text-[8px] font-bold">TA</div>
                            </div>
                            <div className="flex items-center gap-1 text-slate-400 group-hover:text-unifique-primary transition-colors">
                              <ChevronRight size={14} />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {negociosNaFase.length === 0 && (
                      <div className="h-20 flex items-center justify-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vazio</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Shell>
  );
}
