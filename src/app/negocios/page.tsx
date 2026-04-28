"use client";

import React, { useEffect, useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { supabase } from '@/lib/supabase';
import { Negocio, Empresa } from '@/types';
import {
  Plus,
  Briefcase,
  ChevronRight,
  LayoutGrid,
  List as ListIcon,
  X,
  Loader2,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const FASES: { id: Negocio['fase']; color: string }[] = [
  { id: 'Prospecção', color: 'bg-slate-400' },
  { id: 'Qualificação', color: 'bg-blue-400' },
  { id: 'Proposta', color: 'bg-amber-400' },
  { id: 'Negociação', color: 'bg-indigo-400' },
  { id: 'Fechamento', color: 'bg-emerald-500' },
];

const FASE_LABEL_COLORS: Record<string, string> = {
  'Prospecção': 'bg-slate-100 text-slate-600',
  'Qualificação': 'bg-blue-100 text-blue-700',
  'Proposta': 'bg-amber-100 text-amber-700',
  'Negociação': 'bg-indigo-100 text-indigo-700',
  'Fechamento': 'bg-emerald-100 text-emerald-700',
  'Contrato': 'bg-purple-100 text-purple-700',
};

const BLANK_FORM = {
  nome: '',
  empresa_id: '',
  valor: '',
  fase: 'Prospecção' as Negocio['fase'],
  probabilidade: '30',
  curva: 'B' as Negocio['curva'],
  prev_fechamento: '',
  investimento: '0',
  leads: '0',
};

export default function NegociosPage() {
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');

  async function fetchNegocios() {
    const { data } = await supabase
      .from('negocios')
      .select('*, empresas(nome)')
      .order('valor', { ascending: false });
    if (data) setNegocios(data as any);
    setLoading(false);
  }

  useEffect(() => {
    fetchNegocios();
    supabase.from('empresas').select('id, nome').order('nome').then(({ data }) => {
      if (data) setEmpresas(data as any);
    });
  }, []);

  function openModal() {
    setForm({ ...BLANK_FORM, empresa_id: empresas[0]?.id ?? '' });
    setErro('');
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.nome.trim()) { setErro('O nome do negócio é obrigatório.'); return; }
    if (!form.empresa_id) { setErro('Selecione uma empresa.'); return; }
    setSaving(true);
    setErro('');

    const { error } = await supabase.from('negocios').insert([{
      nome: form.nome.trim(),
      empresa_id: form.empresa_id,
      valor: parseFloat(form.valor) || 0,
      fase: form.fase,
      probabilidade: parseInt(form.probabilidade) || 0,
      curva: form.curva,
      investimento: parseFloat(form.investimento) || 0,
      leads: parseInt(form.leads) || 0,
      prev_fechamento: form.prev_fechamento || null,
    }]);

    setSaving(false);
    if (error) { setErro('Erro ao salvar: ' + error.message); return; }

    setShowModal(false);
    setLoading(true);
    fetchNegocios();
  }

  return (
    <Shell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-outfit text-slate-900">Pipeline de Negócios</h1>
            <p className="text-sm text-slate-500">Acompanhe o progresso das oportunidades comerciais.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-white border border-slate-200 rounded-xl p-1 flex gap-1">
              <button
                onClick={() => setView('kanban')}
                className={cn("p-1.5 rounded-lg transition-all", view === 'kanban' ? "bg-unifique-primary text-white shadow-sm" : "text-slate-500 hover:bg-slate-100")}
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setView('list')}
                className={cn("p-1.5 rounded-lg transition-all", view === 'list' ? "bg-unifique-primary text-white shadow-sm" : "text-slate-500 hover:bg-slate-100")}
              >
                <ListIcon size={18} />
              </button>
            </div>
            <button
              onClick={openModal}
              className="flex items-center gap-2 px-4 py-2 bg-unifique-primary text-white rounded-xl font-bold shadow-lg shadow-unifique-primary/20 hover:scale-[1.02] transition-all"
            >
              <Plus size={18} />
              Novo Negócio
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-4">
            <div className="w-8 h-8 border-4 border-unifique-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-500 animate-pulse font-medium">Sincronizando pipeline...</p>
          </div>
        ) : view === 'kanban' ? (
          /* Kanban View */
          <div className="flex gap-4 overflow-x-auto pb-6 -mx-4 px-4 min-h-[600px]">
            {FASES.map((fase) => {
              const negociosNaFase = negocios.filter(n => n.fase === fase.id);
              const totalValor = negociosNaFase.reduce((acc, n) => acc + n.valor, 0);

              return (
                <div key={fase.id} className="flex-shrink-0 w-80 flex flex-col gap-4">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", fase.color)} />
                      <h2 className="font-bold text-sm text-slate-700 uppercase tracking-wider">{fase.id}</h2>
                      <span className="bg-slate-200 text-[10px] font-bold px-2 py-0.5 rounded-full text-slate-500">
                        {negociosNaFase.length}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">{formatCurrency(totalValor)}</span>
                  </div>

                  <div className="flex-1 space-y-3 p-2 bg-slate-100/50 rounded-2xl border border-dashed border-slate-300">
                    <AnimatePresence>
                      {negociosNaFase.map((negocio, idx) => (
                        <motion.div
                          key={negocio.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          layout
                          className="glass-card p-4 hover:border-unifique-primary/50 cursor-pointer group transition-all"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-bold text-unifique-primary uppercase tracking-tight truncate">
                              {negocio.empresas?.nome || 'Empresa desconhecida'}
                            </span>
                            <div className="w-2 h-2 rounded-full bg-unifique-success flex-shrink-0 mt-0.5" />
                          </div>
                          <h3 className="font-bold text-sm text-slate-900 mb-3 group-hover:text-unifique-primary transition-colors">
                            {negocio.nome}
                          </h3>

                          <div className="flex items-center justify-between mt-4">
                            <div>
                              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Valor</p>
                              <p className="text-sm font-bold text-slate-900">{formatCurrency(negocio.valor)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Prob.</p>
                              <p className="text-sm font-bold text-unifique-success">{negocio.probabilidade}%</p>
                            </div>
                          </div>

                          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                            <div className="flex -space-x-2">
                              <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[8px] font-bold text-slate-600">TA</div>
                            </div>
                            <ChevronRight size={14} className="text-slate-400 group-hover:text-unifique-primary transition-colors" />
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
        ) : (
          /* List View */
          <div className="glass-card overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Negócio</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Empresa</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Fase</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Valor</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Prob.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {negocios.map((negocio, idx) => (
                  <motion.tr
                    key={negocio.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    className="hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-unifique-primary/10 flex items-center justify-center text-unifique-primary">
                          <Briefcase size={16} />
                        </div>
                        <span className="font-bold text-sm text-slate-900">{negocio.nome}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-600">{negocio.empresas?.nome ?? '—'}</td>
                    <td className="p-4">
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold", FASE_LABEL_COLORS[negocio.fase])}>
                        {negocio.fase}
                      </span>
                    </td>
                    <td className="p-4 text-right font-bold text-sm text-slate-900">{formatCurrency(negocio.valor)}</td>
                    <td className="p-4 text-center font-bold text-sm text-unifique-success">{negocio.probabilidade}%</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {negocios.length === 0 && (
              <div className="p-12 text-center">
                <Briefcase size={40} className="mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500 font-medium">Nenhum negócio cadastrado.</p>
                <button onClick={openModal} className="mt-4 text-unifique-primary text-sm font-bold hover:underline">
                  Criar primeiro negócio
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Novo Negócio */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,24,64,0.45)', backdropFilter: 'blur(4px)' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Novo Negócio</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-all">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <label className="block">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nome do Negócio *</span>
                <input
                  type="text"
                  value={form.nome}
                  onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  placeholder="Ex: Expansão de Rede — Acme"
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all"
                  autoFocus
                />
              </label>

              <label className="block">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Empresa *</span>
                {empresas.length > 0 ? (
                  <select
                    value={form.empresa_id}
                    onChange={e => setForm(f => ({ ...f, empresa_id: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all bg-white"
                  >
                    <option value="">Selecione...</option>
                    {empresas.map(e => (
                      <option key={e.id} value={e.id}>{e.nome}</option>
                    ))}
                  </select>
                ) : (
                  <p className="mt-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2">
                    Nenhuma empresa cadastrada. <a href="/empresas" className="font-bold underline">Cadastre uma empresa primeiro.</a>
                  </p>
                )}
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Valor (R$)</span>
                  <input
                    type="number"
                    value={form.valor}
                    onChange={e => setForm(f => ({ ...f, valor: e.target.value }))}
                    placeholder="0"
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Probabilidade (%)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.probabilidade}
                    onChange={e => setForm(f => ({ ...f, probabilidade: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fase</span>
                  <select
                    value={form.fase}
                    onChange={e => setForm(f => ({ ...f, fase: e.target.value as any }))}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all bg-white"
                  >
                    {FASES.map(f => <option key={f.id}>{f.id}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Curva</span>
                  <select
                    value={form.curva}
                    onChange={e => setForm(f => ({ ...f, curva: e.target.value as any }))}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all bg-white"
                  >
                    <option value="A">A — Alta prioridade</option>
                    <option value="B">B — Média prioridade</option>
                    <option value="C">C — Baixa prioridade</option>
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Previsão de Fechamento</span>
                <input
                  type="date"
                  value={form.prev_fechamento}
                  onChange={e => setForm(f => ({ ...f, prev_fechamento: e.target.value }))}
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
                disabled={saving || empresas.length === 0}
                className="flex items-center gap-2 px-5 py-2 bg-unifique-primary text-white text-sm font-bold rounded-lg hover:bg-unifique-primary/90 disabled:opacity-60 transition-all"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {saving ? 'Salvando...' : 'Criar Negócio'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </Shell>
  );
}
