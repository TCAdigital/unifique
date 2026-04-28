"use client";

import React, { useEffect, useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { supabase } from '@/lib/supabase';
import { Tarefa } from '@/types';
import { 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  MessageSquare, 
  Phone, 
  Calendar,
  MoreHorizontal,
  ChevronRight,
  Filter,
  CheckCircle
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const PRIORIDADES = {
  'Crítica': 'bg-red-500 text-white',
  'Alta': 'bg-orange-500 text-white',
  'Média': 'bg-blue-500 text-white',
  'Baixa': 'bg-slate-400 text-white'
};

const TIPOS = {
  'Call': { icon: Phone, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  'Reunião': { icon: Calendar, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  'E-mail': { icon: MessageSquare, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  'WhatsApp': { icon: MessageSquare, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  'Proposta': { icon: CheckCircle2, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  'Outro': { icon: CheckCircle, color: 'text-slate-500', bg: 'bg-slate-500/10' },
};

export default function AtividadesPage() {
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'Pendente' | 'Concluída' | 'Todas'>('Todas');

  useEffect(() => {
    async function fetchTarefas() {
      let query = supabase.from('tarefas').select('*').order('prazo', { ascending: true });
      
      if (filter !== 'Todas') {
        query = query.eq('status', filter);
      }

      const { data } = await query;
      if (data) setTarefas(data);
      setLoading(false);
    }
    fetchTarefas();
  }, [filter]);

  return (
    <Shell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-outfit text-slate-900 dark:text-white">Central de Atividades</h1>
            <p className="text-sm text-slate-500">Gestão de tarefas e follow-ups comerciais.</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-unifique-primary text-white rounded-xl font-bold shadow-lg shadow-unifique-primary/20 hover:scale-[1.02] transition-all">
            <Plus size={18} />
            Nova Tarefa
          </button>
        </div>

        {/* Tabs & Filters */}
        <div className="flex items-center justify-between">
          <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200 dark:border-white/10">
            {['Todas', 'Pendente', 'Concluída'].map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t as any)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                  filter === t ? "bg-white dark:bg-white/10 text-unifique-primary shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                {t}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-500 hover:text-unifique-primary transition-all">
            <Filter size={14} />
            Filtros Avançados
          </button>
        </div>

        {/* Task List */}
        <div className="space-y-3">
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-4">
              <div className="w-8 h-8 border-4 border-unifique-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-500">Carregando tarefas...</p>
            </div>
          ) : tarefas.length > 0 ? (
            <AnimatePresence mode="popLayout">
              {tarefas.map((tarefa, idx) => {
                const config = TIPOS[tarefa.tipo] || TIPOS['Outro'];
                const isOverdue = new Date(tarefa.prazo) < new Date() && tarefa.status === 'Pendente';
                
                return (
                  <motion.div
                    key={tarefa.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={cn(
                      "glass-card p-4 flex items-center gap-4 group hover:border-unifique-primary/30 transition-all",
                      tarefa.status === 'Concluída' && "opacity-60"
                    )}
                  >
                    <button className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                      tarefa.status === 'Concluída' 
                        ? "bg-unifique-success border-unifique-success text-white" 
                        : "border-slate-300 dark:border-white/10 hover:border-unifique-primary"
                    )}>
                      {tarefa.status === 'Concluída' && <CheckCircle size={14} />}
                    </button>

                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", config.bg, config.color)}>
                      <config.icon size={20} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={cn("text-sm font-bold truncate", tarefa.status === 'Concluída' && "line-through")}>
                          {tarefa.titulo}
                        </h3>
                        <span className={cn("text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tighter", PRIORIDADES[tarefa.prioridade])}>
                          {tarefa.prioridade}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar size={10} />
                          {formatDate(tarefa.prazo)}
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle2 size={10} />
                          ID: {tarefa.id.slice(0, 8)}
                        </span>
                        {isOverdue && (
                          <span className="flex items-center gap-1 text-red-500 font-bold">
                            <AlertCircle size={10} />
                            VENCIDA
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="hidden sm:flex -space-x-2">
                        <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-white/10 border-2 border-white dark:border-unifique-side flex items-center justify-center text-[8px] font-bold">TA</div>
                      </div>
                      <button className="p-2 text-slate-400 hover:text-unifique-primary transition-all">
                        <MoreHorizontal size={18} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          ) : (
            <div className="glass-card p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-slate-300" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white">Tudo em dia!</h3>
              <p className="text-sm text-slate-500 mt-1">Você não tem tarefas pendentes para este filtro.</p>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
