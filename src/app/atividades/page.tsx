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
  Filter,
  CheckCircle,
  X,
  Loader2,
  Mail,
  Briefcase,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { motion, AnimatePresence } from 'framer-motion';

const PRIORIDADES = {
  'Crítica': 'bg-red-500 text-white',
  'Alta': 'bg-orange-500 text-white',
  'Média': 'bg-blue-500 text-white',
  'Baixa': 'bg-slate-400 text-white',
};

const TIPOS = {
  'Call': { icon: Phone, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  'Reunião': { icon: Calendar, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  'E-mail': { icon: Mail, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  'WhatsApp': { icon: MessageSquare, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  'Proposta': { icon: Briefcase, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  'Outro': { icon: CheckCircle, color: 'text-slate-500', bg: 'bg-slate-500/10' },
};

const BLANK_FORM = {
  titulo: '',
  tipo: 'Call' as Tarefa['tipo'],
  prazo: new Date().toISOString().split('T')[0],
  prioridade: 'Média' as Tarefa['prioridade'],
};

export default function AtividadesPage() {
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'Pendente' | 'Concluída' | 'Todas'>('Todas');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');
  const { user } = useAuth();
  const [completing, setCompleting] = useState<string | null>(null);

  async function fetchTarefas() {
    let query = supabase.from('tarefas').select('*').order('prazo', { ascending: true });
    if (filter !== 'Todas') query = query.eq('status', filter);
    const { data } = await query;
    if (data) setTarefas(data);
    setLoading(false);
  }

  useEffect(() => {
    setLoading(true);
    fetchTarefas();
  }, [filter]);

  async function handleComplete(tarefa: Tarefa) {
    if (tarefa.status === 'Concluída') return;
    setCompleting(tarefa.id);
    await supabase.from('tarefas').update({ status: 'Concluída' }).eq('id', tarefa.id);
    setCompleting(null);
    setTarefas(prev => prev.map(t => t.id === tarefa.id ? { ...t, status: 'Concluída' } : t));
  }

  function openModal() {
    setForm(BLANK_FORM);
    setErro('');
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.titulo.trim()) { setErro('O título da tarefa é obrigatório.'); return; }
    if (!form.prazo) { setErro('O prazo é obrigatório.'); return; }
    setSaving(true);
    setErro('');

    const { error } = await supabase.from('tarefas').insert([{
      titulo: form.titulo.trim(),
      tipo: form.tipo,
      prazo: form.prazo,
      prioridade: form.prioridade,
      status: 'Pendente',
    }]);

    setSaving(false);
    if (error) { setErro('Erro ao salvar: ' + error.message); return; }

    setShowModal(false);
    setLoading(true);
    fetchTarefas();
  }

  return (
    <Shell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-outfit text-slate-900">Central de Atividades</h1>
            <p className="text-sm text-slate-500">Gestão de tarefas e follow-ups comerciais.</p>
          </div>
          <button
            onClick={openModal}
            className="flex items-center gap-2 px-4 py-2 bg-unifique-primary text-white rounded-xl font-bold shadow-lg shadow-unifique-primary/20 hover:scale-[1.02] transition-all"
          >
            <Plus size={18} />
            Nova Tarefa
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            {(['Todas', 'Pendente', 'Concluída'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                  filter === t ? "bg-white text-unifique-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
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
                const isOverdue = tarefa.prazo && new Date(tarefa.prazo) < new Date() && tarefa.status === 'Pendente';
                const isCompleting = completing === tarefa.id;

                return (
                  <motion.div
                    key={tarefa.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className={cn(
                      "glass-card p-4 flex items-center gap-4 group hover:border-unifique-primary/30 transition-all",
                      tarefa.status === 'Concluída' && "opacity-60"
                    )}
                  >
                    <button
                      onClick={() => handleComplete(tarefa)}
                      disabled={tarefa.status === 'Concluída' || !!isCompleting}
                      className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0",
                        tarefa.status === 'Concluída'
                          ? "bg-unifique-success border-unifique-success text-white cursor-default"
                          : "border-slate-300 hover:border-unifique-primary hover:bg-unifique-primary/10 cursor-pointer"
                      )}
                      title={tarefa.status === 'Pendente' ? 'Marcar como concluída' : undefined}
                    >
                      {isCompleting
                        ? <Loader2 size={12} className="animate-spin text-unifique-primary" />
                        : tarefa.status === 'Concluída' && <CheckCircle size={14} />}
                    </button>

                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", config.bg, config.color)}>
                      <config.icon size={20} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={cn("text-sm font-bold truncate text-slate-900", tarefa.status === 'Concluída' && "line-through text-slate-400")}>
                          {tarefa.titulo}
                        </h3>
                        <span className={cn("text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tighter flex-shrink-0", PRIORIDADES[tarefa.prioridade])}>
                          {tarefa.prioridade}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar size={10} />
                          {formatDate(tarefa.prazo)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {tarefa.tipo}
                        </span>
                        {isOverdue && (
                          <span className="flex items-center gap-1 text-red-500 font-bold">
                            <AlertCircle size={10} />
                            VENCIDA
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="hidden sm:flex -space-x-2">
                        <div className="w-7 h-7 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[8px] font-bold text-slate-600">TA</div>
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
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-slate-300" />
              </div>
              <h3 className="font-bold text-slate-900">Tudo em dia!</h3>
              <p className="text-sm text-slate-500 mt-1">Não há tarefas para este filtro.</p>
              <button onClick={openModal} className="mt-4 text-unifique-primary text-sm font-bold hover:underline">
                Criar nova tarefa
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal Nova Tarefa */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,24,64,0.45)', backdropFilter: 'blur(4px)' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Nova Tarefa</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-all">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <label className="block">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Título *</span>
                <input
                  type="text"
                  value={form.titulo}
                  onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                  placeholder="Ex: Ligar para cliente X sobre proposta"
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all"
                  autoFocus
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo</span>
                  <select
                    value={form.tipo}
                    onChange={e => setForm(f => ({ ...f, tipo: e.target.value as any }))}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all bg-white"
                  >
                    {Object.keys(TIPOS).map(t => <option key={t}>{t}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Prioridade</span>
                  <select
                    value={form.prioridade}
                    onChange={e => setForm(f => ({ ...f, prioridade: e.target.value as any }))}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all bg-white"
                  >
                    {Object.keys(PRIORIDADES).map(p => <option key={p}>{p}</option>)}
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Prazo *</span>
                <input
                  type="date"
                  value={form.prazo}
                  onChange={e => setForm(f => ({ ...f, prazo: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all"
                />
              </label>

              {erro && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
                  {erro}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-100">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-unifique-primary text-white text-sm font-bold rounded-lg hover:bg-unifique-primary/90 disabled:opacity-60 transition-all"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {saving ? 'Salvando...' : 'Criar Tarefa'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </Shell>
  );
}
