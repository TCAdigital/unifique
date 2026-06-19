"use client";

import React, { useEffect, useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Negocio, Empresa } from '@/types';
import { NotasSection } from '@/components/NotasSection';
import { ConcorrentesSection } from '@/components/ConcorrentesSection';
import {
  Plus, Briefcase, ChevronRight, LayoutGrid, List as ListIcon,
  X, Loader2, Trash2, AlertTriangle, Tag,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const FASES_KANBAN: { id: Negocio['fase']; color: string }[] = [
  { id: 'Prospecção', color: 'bg-slate-400' },
  { id: 'Qualificação', color: 'bg-blue-400' },
  { id: 'Proposta', color: 'bg-amber-400' },
  { id: 'Negociação', color: 'bg-indigo-400' },
  { id: 'Fechamento', color: 'bg-emerald-500' },
  { id: 'Contrato', color: 'bg-purple-500' },
];

const FASE_LABEL_COLORS: Record<string, string> = {
  'Prospecção':  'bg-slate-100 text-slate-600',
  'Qualificação':'bg-blue-100 text-blue-700',
  'Proposta':    'bg-amber-100 text-amber-700',
  'Negociação':  'bg-indigo-100 text-indigo-700',
  'Fechamento':  'bg-emerald-100 text-emerald-700',
  'Contrato':    'bg-purple-100 text-purple-700',
  'Ganho':       'bg-emerald-600 text-white',
  'Perdido':     'bg-red-100 text-red-700',
};

const PRODUTOS_UNIFIQUE = [
  'Cloud', 'Cibersegurança', 'Outsourcing IT', 'Network 5GaaS Privativa',
  'Wi-Fi Business', 'Telemedicina', 'Casa Inteligente', 'Projetos B2G PPP',
  'Projetos Câmeras B2G (Especial)', 'Unifique Câmeras B2B',
  'Projetos Eventos – Mercado', 'Rede Móvel IoT B2B',
  'Fibra Dedicado e Interconexão B2B - Mercado',
  'Fibra Dedicado e Interconexão B2G - Mercado',
  'Fibra BL Empresas B2B – Mercado', 'Proteção DDoS Fibra – Mercado',
  'Rastreadores Unifique',
];

const FABRICANTES = [
  'Fortinet', 'CrowdStrike', 'Tenable', 'Wazuh', 'Prestador de Serviço',
  'IBM', 'ZTE', 'Huawei', 'TP-LINK', 'CISCO', 'Microsoft',
  'Google WorkSpace', 'Juniper', 'Omnissa', 'Kubernetes', 'Cloud IA',
];

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
  responsavel: '',
  especialista_nome: '',
  produtos: [] as string[],
  link_proposta: '',
  custo_oportunidade: '0',
  vigencia_meses: '0',
};

function negocioToForm(n: Negocio) {
  return {
    nome: n.nome,
    empresa_id: n.empresa_id,
    valor: String(n.valor),
    fase: n.fase,
    probabilidade: String(n.probabilidade),
    curva: n.curva ?? 'B',
    prev_fechamento: n.prev_fechamento ? n.prev_fechamento.split('T')[0] : '',
    investimento: String(n.investimento),
    leads: String(n.leads),
    responsavel: n.responsavel ?? '',
    especialista_nome: n.especialista_nome ?? '',
    produtos: Array.isArray(n.produtos) ? [...n.produtos] : [],
    link_proposta: n.link_proposta ?? '',
    custo_oportunidade: String(n.custo_oportunidade ?? 0),
    vigencia_meses: String(n.vigencia_meses ?? 0),
  };
}

export default function NegociosPage() {
  const { user } = useAuth();
  const isAdmin = user?.perfil === 'admin';
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [usuarios, setUsuarios] = useState<{ id: string; nome: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const [produtoSelecionado, setProdutoSelecionado] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [erro, setErro] = useState('');

  async function fetchNegocios() {
    let query = supabase.from('negocios').select('*, empresas(nome)').order('valor', { ascending: false });
    if (!isAdmin && user) query = query.eq('responsavel', user.nome);
    const { data } = await query;
    if (data) setNegocios(data as any);
    setLoading(false);
  }

  useEffect(() => {
    fetchNegocios();
    supabase.from('empresas').select('id, nome').order('nome').then(({ data }) => {
      if (data) setEmpresas(data as any);
    });
    supabase.from('usuarios').select('id, nome').eq('ativo', true).order('nome').then(({ data }) => {
      if (data) setUsuarios(data);
    });
  }, []);

  function openCreate() {
    setEditingId(null);
    setConfirmDelete(false);
    setForm({ ...BLANK_FORM, empresa_id: empresas[0]?.id ?? '' });
    setProdutoSelecionado('');
    setErro('');
    setShowModal(true);
  }

  function openEdit(negocio: Negocio) {
    setEditingId(negocio.id);
    setConfirmDelete(false);
    setForm(negocioToForm(negocio));
    setProdutoSelecionado('');
    setErro('');
    setShowModal(true);
  }

  function addProduto() {
    if (!produtoSelecionado || form.produtos.includes(produtoSelecionado)) return;
    setForm(f => ({ ...f, produtos: [...f.produtos, produtoSelecionado] }));
    setProdutoSelecionado('');
  }

  function removeProduto(p: string) {
    setForm(f => ({ ...f, produtos: f.produtos.filter(x => x !== p) }));
  }

  async function handleSave() {
    if (!form.nome.trim()) { setErro('O nome do negócio é obrigatório.'); return; }
    if (!form.empresa_id) { setErro('Selecione uma empresa.'); return; }
    setSaving(true);
    setErro('');

    const vigencia = parseInt(form.vigencia_meses) || 0;
    const valor = parseFloat(form.valor) || 0;
    const payload = {
      nome: form.nome.trim(),
      empresa_id: form.empresa_id,
      valor,
      fase: form.fase,
      probabilidade: parseInt(form.probabilidade) || 0,
      curva: form.curva,
      investimento: parseFloat(form.investimento) || 0,
      leads: parseInt(form.leads) || 0,
      prev_fechamento: form.prev_fechamento || null,
      responsavel: form.responsavel || null,
      especialista_nome: form.especialista_nome || null,
      produtos: form.produtos,
      link_proposta: form.link_proposta || null,
      custo_oportunidade: parseFloat(form.custo_oportunidade) || 0,
      vigencia_meses: vigencia,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from('negocios').update(payload).eq('id', editingId));
    } else {
      ({ error } = await supabase.from('negocios').insert([payload]));
    }

    setSaving(false);
    if (error) { setErro('Erro ao salvar: ' + error.message); return; }

    setShowModal(false);
    setLoading(true);
    fetchNegocios();
  }

  async function handleDelete() {
    if (!editingId) return;
    setDeleting(true);
    await supabase.from('negocios').delete().eq('id', editingId);
    setDeleting(false);
    setShowModal(false);
    setNegocios(prev => prev.filter(n => n.id !== editingId));
  }

  const negociosAtivos = negocios.filter(n => n.fase !== 'Ganho' && n.fase !== 'Perdido');
  const negociosFechados = negocios.filter(n => n.fase === 'Ganho' || n.fase === 'Perdido');

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
              <button onClick={() => setView('kanban')}
                className={cn("p-1.5 rounded-lg transition-all", view === 'kanban' ? "bg-unifique-primary text-white shadow-sm" : "text-slate-500 hover:bg-slate-100")}>
                <LayoutGrid size={18} />
              </button>
              <button onClick={() => setView('list')}
                className={cn("p-1.5 rounded-lg transition-all", view === 'list' ? "bg-unifique-primary text-white shadow-sm" : "text-slate-500 hover:bg-slate-100")}>
                <ListIcon size={18} />
              </button>
            </div>
            <button onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-unifique-primary text-white rounded-xl font-bold shadow-lg shadow-unifique-primary/20 hover:scale-[1.02] transition-all">
              <Plus size={18} /> Novo Negócio
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-4">
            <div className="w-8 h-8 border-4 border-unifique-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-500 animate-pulse font-medium">Sincronizando pipeline...</p>
          </div>
        ) : view === 'kanban' ? (
          <>
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 min-h-[500px]">
              {FASES_KANBAN.map((fase) => {
                const negociosNaFase = negociosAtivos.filter(n => n.fase === fase.id);
                const totalValor = negociosNaFase.reduce((acc, n) => acc + n.valor, 0);
                return (
                  <div key={fase.id} className="flex-shrink-0 w-72 flex flex-col gap-3">
                    <div className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", fase.color)} />
                        <h2 className="font-bold text-xs text-slate-700 uppercase tracking-wider">{fase.id}</h2>
                        <span className="bg-slate-200 text-[10px] font-bold px-2 py-0.5 rounded-full text-slate-500">{negociosNaFase.length}</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">{formatCurrency(totalValor)}</span>
                    </div>
                    <div className="flex-1 space-y-3 p-2 bg-slate-100/50 rounded-2xl border border-dashed border-slate-300 min-h-[200px]">
                      <AnimatePresence>
                        {negociosNaFase.map((negocio, idx) => (
                          <motion.div key={negocio.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }} layout
                            onClick={() => openEdit(negocio)}
                            className="glass-card p-4 hover:border-unifique-primary/50 cursor-pointer group transition-all">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-[10px] font-bold text-unifique-primary uppercase tracking-tight truncate">
                                {negocio.empresas?.nome || 'Empresa desconhecida'}
                              </span>
                            </div>
                            <h3 className="font-bold text-sm text-slate-900 mb-2 group-hover:text-unifique-primary transition-colors">{negocio.nome}</h3>
                            {Array.isArray(negocio.produtos) && negocio.produtos.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-2">
                                {negocio.produtos.slice(0, 2).map(p => (
                                  <span key={p} className="text-[9px] font-bold px-1.5 py-0.5 bg-unifique-primary/10 text-unifique-primary rounded">{p}</span>
                                ))}
                                {negocio.produtos.length > 2 && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">+{negocio.produtos.length - 2}</span>
                                )}
                              </div>
                            )}
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                              <div>
                                <p className="text-[10px] text-slate-500 font-bold">Valor</p>
                                <p className="text-sm font-bold text-slate-900">{formatCurrency(negocio.valor)}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] text-slate-500 font-bold">Prob.</p>
                                <p className="text-sm font-bold text-unifique-success">{negocio.probabilidade}%</p>
                              </div>
                              <ChevronRight size={14} className="text-slate-400 group-hover:text-unifique-primary transition-colors" />
                            </div>
                            {negocio.responsavel && (
                              <p className="mt-2 text-[10px] text-slate-400 truncate">
                                <span className="font-bold">Consultor:</span> {negocio.responsavel}
                              </p>
                            )}
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

            {/* Fechados (Ganho / Perdido) */}
            {negociosFechados.length > 0 && (
              <div className="glass-card overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Encerrados</span>
                  <span className="bg-slate-200 text-[10px] font-bold px-2 py-0.5 rounded-full text-slate-500">{negociosFechados.length}</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {negociosFechados.map(n => (
                    <div key={n.id} onClick={() => openEdit(n)}
                      className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 cursor-pointer transition-all">
                      <span className={cn("text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0", FASE_LABEL_COLORS[n.fase])}>{n.fase}</span>
                      <span className="font-bold text-sm text-slate-800 flex-1 truncate">{n.nome}</span>
                      <span className="text-xs text-slate-500 truncate">{n.empresas?.nome}</span>
                      <span className="font-bold text-sm text-slate-700 flex-shrink-0">{formatCurrency(n.valor)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          /* List View */
          <div className="glass-card overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Negócio</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Empresa</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Fase</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Consultor</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Produtos</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Valor</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Prob.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {negocios.map((negocio, idx) => (
                  <motion.tr key={negocio.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.03 }} onClick={() => openEdit(negocio)}
                    className="hover:bg-slate-50 transition-all cursor-pointer">
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
                    <td className="p-4 text-sm text-slate-500">{negocio.responsavel || '—'}</td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(negocio.produtos) && negocio.produtos.slice(0, 2).map(p => (
                          <span key={p} className="text-[9px] font-bold px-1.5 py-0.5 bg-unifique-primary/10 text-unifique-primary rounded">{p}</span>
                        ))}
                        {Array.isArray(negocio.produtos) && negocio.produtos.length > 2 && (
                          <span className="text-[9px] text-slate-400">+{negocio.produtos.length - 2}</span>
                        )}
                      </div>
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
                <button onClick={openCreate} className="mt-4 text-unifique-primary text-sm font-bold hover:underline">Criar primeiro negócio</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Negócio */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,24,64,0.45)', backdropFilter: 'blur(4px)' }}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {confirmDelete ? (
              <>
                <div className="p-6 text-center">
                  <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle size={28} className="text-red-500" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 mb-2">Excluir Negócio?</h2>
                  <p className="text-sm text-slate-500">Esta ação não pode ser desfeita.</p>
                </div>
                <div className="flex items-center justify-center gap-3 p-6 border-t border-slate-100">
                  <button onClick={() => setConfirmDelete(false)}
                    className="px-5 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-all">Cancelar</button>
                  <button onClick={handleDelete} disabled={deleting}
                    className="flex items-center gap-2 px-5 py-2 bg-red-500 text-white text-sm font-bold rounded-lg hover:bg-red-600 disabled:opacity-60 transition-all">
                    {deleting && <Loader2 size={14} className="animate-spin" />}
                    {deleting ? 'Excluindo...' : 'Sim, Excluir'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                  <h2 className="text-lg font-bold text-slate-900">{editingId ? 'Editar Negócio' : 'Novo Negócio'}</h2>
                  <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-all">
                    <X size={18} />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  {/* Dados básicos */}
                  <label className="block">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nome do Negócio *</span>
                    <input type="text" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                      placeholder="Ex: Expansão de Rede — Acme" autoFocus
                      className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all" />
                  </label>

                  <label className="block">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Empresa *</span>
                    {empresas.length > 0 ? (
                      <select value={form.empresa_id} onChange={e => setForm(f => ({ ...f, empresa_id: e.target.value }))}
                        className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all bg-white">
                        <option value="">Selecione...</option>
                        {empresas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
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
                      <input type="number" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} placeholder="0"
                        className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all" />
                    </label>
                    <label className="block">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Probabilidade (%)</span>
                      <input type="number" min="0" max="100" value={form.probabilidade} onChange={e => setForm(f => ({ ...f, probabilidade: e.target.value }))}
                        className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all" />
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fase</span>
                      <select value={form.fase} onChange={e => setForm(f => ({ ...f, fase: e.target.value as any }))}
                        className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all bg-white">
                        <option value="Prospecção">Prospecção</option>
                        <option value="Qualificação">Qualificação</option>
                        <option value="Proposta">Proposta</option>
                        <option value="Negociação">Negociação</option>
                        <option value="Fechamento">Fechamento</option>
                        <option value="Contrato">Contrato</option>
                        <option disabled>──────────</option>
                        <option value="Ganho">✓ Ganho</option>
                        <option value="Perdido">✗ Perdido</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Curva</span>
                      <select value={form.curva} onChange={e => setForm(f => ({ ...f, curva: e.target.value as any }))}
                        className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all bg-white">
                        <option value="A">A — Alta prioridade</option>
                        <option value="B">B — Média prioridade</option>
                        <option value="C">C — Baixa prioridade</option>
                      </select>
                    </label>
                  </div>

                  <label className="block">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Previsão de Fechamento</span>
                    <input type="date" value={form.prev_fechamento} onChange={e => setForm(f => ({ ...f, prev_fechamento: e.target.value }))}
                      className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all" />
                  </label>

                  {/* Produto / Serviço */}
                  <div className="border-t border-slate-100 pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Tag size={14} className="text-slate-400" />
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Produto / Serviço *</p>
                    </div>
                    <div className="flex gap-2 mb-2">
                      <select value={produtoSelecionado} onChange={e => setProdutoSelecionado(e.target.value)}
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary bg-white">
                        <option value="">Selecionar produto/serviço...</option>
                        <optgroup label="Unifique">
                          {PRODUTOS_UNIFIQUE.filter(p => !form.produtos.includes(p)).map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </optgroup>
                        <optgroup label="Fabricantes / Parceiros">
                          {FABRICANTES.filter(p => !form.produtos.includes(p)).map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </optgroup>
                      </select>
                      <button onClick={addProduto} disabled={!produtoSelecionado}
                        className="px-3 py-2 bg-unifique-primary text-white rounded-lg disabled:opacity-50 transition-all flex-shrink-0">
                        <Plus size={14} />
                      </button>
                    </div>
                    {form.produtos.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {form.produtos.map(p => (
                          <span key={p} className="flex items-center gap-1 px-2.5 py-1 bg-unifique-primary/10 text-unifique-primary text-xs font-bold rounded-lg">
                            {p}
                            <button onClick={() => removeProduto(p)} className="hover:text-red-500 transition-colors ml-0.5">
                              <X size={10} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Responsáveis */}
                  <div className="border-t border-slate-100 pt-4">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Responsáveis</p>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="block">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Consultor</span>
                        <select value={form.responsavel} onChange={e => setForm(f => ({ ...f, responsavel: e.target.value }))}
                          className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary bg-white">
                          <option value="">— Sem atribuição —</option>
                          {usuarios.map(u => <option key={u.id} value={u.nome}>{u.nome}</option>)}
                        </select>
                      </label>
                      <label className="block">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Especialista</span>
                        <select value={form.especialista_nome} onChange={e => setForm(f => ({ ...f, especialista_nome: e.target.value }))}
                          className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary bg-white">
                          <option value="">— Sem atribuição —</option>
                          {usuarios.map(u => <option key={u.id} value={u.nome}>{u.nome}</option>)}
                        </select>
                      </label>
                    </div>
                  </div>

                  {/* Proposta & Financeiro */}
                  <div className="border-t border-slate-100 pt-4">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Proposta & Financeiro</p>

                    <label className="block mb-3">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Link da Proposta</span>
                      <input type="url" value={form.link_proposta} onChange={e => setForm(f => ({ ...f, link_proposta: e.target.value }))}
                        placeholder="https://..."
                        className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all" />
                    </label>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <label className="block">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Custo Oportunidade (R$)</span>
                        <input type="number" min="0" value={form.custo_oportunidade} onChange={e => setForm(f => ({ ...f, custo_oportunidade: e.target.value }))}
                          className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all" />
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <label className="block">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vigência do Contrato</span>
                        <select value={form.vigencia_meses} onChange={e => setForm(f => ({ ...f, vigencia_meses: e.target.value }))}
                          className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all bg-white">
                          <option value="0">— Sem vigência —</option>
                          <option value="12">12 meses</option>
                          <option value="24">24 meses</option>
                          <option value="36">36 meses</option>
                          <option value="48">48 meses</option>
                          <option value="60">60 meses</option>
                        </select>
                      </label>
                      <div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contrato Global</span>
                        <div className="mt-1 w-full px-3 py-2 border border-slate-100 bg-slate-50 rounded-lg text-sm font-bold text-unifique-primary">
                          {(parseFloat(form.valor) || 0) * (parseInt(form.vigencia_meses) || 0) > 0
                            ? `R$ ${((parseFloat(form.valor) || 0) * (parseInt(form.vigencia_meses) || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                            : '—'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Concorrentes */}
                  <ConcorrentesSection negocioId={editingId} />

                  {/* Notas */}
                  <NotasSection entidadeId={editingId} entidadeTipo="negocios" />

                  {erro && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">{erro}</div>
                  )}
                </div>

                <div className="flex items-center justify-between p-6 border-t border-slate-100">
                  {editingId ? (
                    <button onClick={() => setConfirmDelete(true)}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-red-500 hover:bg-red-50 rounded-lg transition-all">
                      <Trash2 size={14} /> Excluir
                    </button>
                  ) : <div />}
                  <div className="flex items-center gap-3">
                    <button onClick={() => setShowModal(false)}
                      className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-all">Cancelar</button>
                    <button onClick={handleSave} disabled={saving || empresas.length === 0}
                      className="flex items-center gap-2 px-5 py-2 bg-unifique-primary text-white text-sm font-bold rounded-lg hover:bg-unifique-primary/90 disabled:opacity-60 transition-all">
                      {saving && <Loader2 size={14} className="animate-spin" />}
                      {saving ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Criar Negócio'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </Shell>
  );
}
