"use client";

import React, { useEffect, useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { supabase } from '@/lib/supabase';
import { Empresa } from '@/types';
import {
  Plus, Search, Filter, MoreHorizontal, Building2,
  ArrowUpDown, X, Loader2, Trash2, Pencil,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';

const SEGMENTOS = ['Tecnologia', 'Saúde', 'Educação', 'Indústria', 'Varejo', 'Serviços', 'Agronegócio', 'Governo', 'Outro'];
const SETORES = ['Privado', 'Público', 'Misto'] as const;
const PORTES = ['Pequeno', 'Médio', 'Grande'] as const;
const STATUS_LIST = ['Lead', 'Negociando', 'Ativo'] as const;

const STATUS_COLORS: Record<string, string> = {
  Ativo: 'bg-emerald-100 text-emerald-700',
  Negociando: 'bg-blue-100 text-blue-700',
  Lead: 'bg-slate-100 text-slate-600',
};

const BLANK_FORM = {
  nome: '', cnpj: '', segmento: 'Tecnologia',
  setor: 'Privado' as const, porte: 'Médio' as const,
  status: 'Lead' as const, faturamento: '', colaboradores: '',
  cidade: '', contato: '', email_contato: '', tel: '',
};

function empresaToForm(e: Empresa) {
  return {
    nome: e.nome ?? '',
    cnpj: e.cnpj ?? '',
    segmento: e.segmento ?? 'Tecnologia',
    setor: (e.setor ?? 'Privado') as typeof BLANK_FORM.setor,
    porte: (e.porte ?? 'Médio') as typeof BLANK_FORM.porte,
    status: (e.status ?? 'Lead') as typeof BLANK_FORM.status,
    faturamento: e.faturamento ? String(e.faturamento) : '',
    colaboradores: e.colaboradores ? String(e.colaboradores) : '',
    cidade: e.cidade ?? '',
    contato: e.contato ?? '',
    email_contato: e.email_contato ?? '',
    tel: e.tel ?? '',
  };
}

export default function EmpresasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [erro, setErro] = useState('');
  const [menuId, setMenuId] = useState<string | null>(null);

  async function fetchEmpresas() {
    const { data } = await supabase.from('empresas').select('*').order('nome');
    if (data) setEmpresas(data);
    setLoading(false);
  }

  useEffect(() => { fetchEmpresas(); }, []);
  useEffect(() => {
    const close = () => setMenuId(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const filtered = empresas.filter(e =>
    e.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.segmento.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function openCreate() {
    setEditingId(null);
    setForm(BLANK_FORM);
    setErro('');
    setConfirmDelete(false);
    setShowModal(true);
  }

  function openEdit(e: Empresa) {
    setEditingId(e.id);
    setForm(empresaToForm(e));
    setErro('');
    setConfirmDelete(false);
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.nome.trim()) { setErro('O nome da empresa é obrigatório.'); return; }
    setSaving(true); setErro('');

    const payload: Record<string, unknown> = {
      nome: form.nome.trim(),
      segmento: form.segmento,
      setor: form.setor,
      faturamento: parseFloat(form.faturamento) || 0,
      colaboradores: parseInt(form.colaboradores) || 0,
    };
    if (form.cnpj.trim()) payload.cnpj = form.cnpj.trim();
    if (form.porte) payload.porte = form.porte;
    if (form.status) payload.status = form.status;
    if (form.cidade.trim()) payload.cidade = form.cidade.trim();
    if (form.contato.trim()) payload.contato = form.contato.trim();
    if (form.email_contato.trim()) payload.email_contato = form.email_contato.trim();
    if (form.tel.trim()) payload.tel = form.tel.trim();

    const { error } = editingId
      ? await supabase.from('empresas').update(payload).eq('id', editingId)
      : await supabase.from('empresas').insert([payload]);

    setSaving(false);
    if (error) {
      setErro('Erro: ' + error.message);
      return;
    }
    setShowModal(false);
    setLoading(true);
    fetchEmpresas();
  }

  async function handleDelete() {
    if (!editingId) return;
    setDeleting(true);
    await supabase.from('empresas').delete().eq('id', editingId);
    setDeleting(false);
    setShowModal(false);
    setEmpresas(prev => prev.filter(e => e.id !== editingId));
  }

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-outfit text-slate-900">Gestão de Empresas</h1>
            <p className="text-sm text-slate-500">Visualize e gerencie as contas corporativas da Unifique.</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-unifique-primary text-white rounded-xl font-bold shadow-lg shadow-unifique-primary/20 hover:scale-[1.02] transition-all">
            <Plus size={18} /> Nova Empresa
          </button>
        </div>

        <div className="glass-card p-4 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Buscar por nome ou segmento..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-unifique-primary/50 text-sm"
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all"><Filter size={16} />Filtros</button>
            <button className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all"><ArrowUpDown size={16} />Ordenar</button>
          </div>
        </div>

        <div className="glass-card overflow-hidden">
          {loading ? (
            <div className="p-12 flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-4 border-unifique-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-500 animate-pulse">Carregando...</p>
            </div>
          ) : filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Empresa</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Segmento</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Faturamento</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Colaboradores</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="p-4 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filtered.map((empresa, idx) => (
                    <motion.tr key={empresa.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04 }} className="hover:bg-slate-50 transition-all cursor-pointer"
                      onClick={() => openEdit(empresa)}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-unifique-primary/10 flex items-center justify-center text-unifique-primary">
                            <Building2 size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-slate-900">{empresa.nome}</p>
                            <p className="text-[10px] text-slate-500">
                              {empresa.cnpj ? `CNPJ ${empresa.cnpj}` : empresa.setor}
                              {empresa.cidade ? ` · ${empresa.cidade}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{empresa.segmento}</span></td>
                      <td className="p-4 text-right"><span className="font-mono text-sm font-bold text-slate-700">{formatCurrency(empresa.faturamento)}</span></td>
                      <td className="p-4 text-center text-sm text-slate-600">{empresa.colaboradores}</td>
                      <td className="p-4">
                        <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold", STATUS_COLORS[empresa.status] ?? STATUS_COLORS.Lead)}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />{empresa.status ?? 'Lead'}
                        </span>
                      </td>
                      <td className="p-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="relative inline-block">
                          <button onClick={e => { e.stopPropagation(); setMenuId(menuId === empresa.id ? null : empresa.id); }}
                            className="p-2 text-slate-400 hover:text-unifique-primary transition-colors rounded-lg hover:bg-slate-100">
                            <MoreHorizontal size={18} />
                          </button>
                          {menuId === empresa.id && (
                            <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 min-w-[130px] overflow-hidden">
                              <button onClick={() => { openEdit(empresa); setMenuId(null); }}
                                className="flex items-center gap-2 w-full px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all">
                                <Pencil size={13} />Editar
                              </button>
                              <button onClick={() => { setEditingId(empresa.id); setConfirmDelete(true); setShowModal(true); setMenuId(null); }}
                                className="flex items-center gap-2 w-full px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 transition-all">
                                <Trash2 size={13} />Excluir
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <Building2 size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">Nenhuma empresa encontrada.</p>
              <button onClick={openCreate} className="mt-4 text-unifique-primary text-sm font-bold hover:underline">Cadastrar primeira empresa</button>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,24,64,0.45)', backdropFilter: 'blur(4px)' }}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

            {confirmDelete ? (
              <>
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-red-600">Confirmar exclusão</h2>
                  <button onClick={() => { setShowModal(false); setConfirmDelete(false); }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><X size={18} /></button>
                </div>
                <div className="p-6">
                  <p className="text-slate-600 text-sm">Esta ação é irreversível. Tem certeza que deseja excluir esta empresa?</p>
                  <div className="flex gap-3 mt-6">
                    <button onClick={() => { setShowModal(false); setConfirmDelete(false); }}
                      className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">Cancelar</button>
                    <button onClick={handleDelete} disabled={deleting}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 disabled:opacity-60 transition-all">
                      {deleting && <Loader2 size={14} className="animate-spin" />}
                      {deleting ? 'Excluindo...' : 'Sim, excluir'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                  <h2 className="text-lg font-bold text-slate-900">{editingId ? 'Editar Empresa' : 'Nova Empresa'}</h2>
                  <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><X size={18} /></button>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block col-span-2 sm:col-span-1">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nome da Empresa *</span>
                      <input type="text" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                        placeholder="Ex: Acme Tecnologia LTDA" autoFocus
                        className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all" />
                    </label>
                    <label className="block">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">CNPJ</span>
                      <input type="text" value={form.cnpj} onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))}
                        placeholder="00.000.000/0001-00"
                        className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all" />
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Segmento *</span>
                      <select value={form.segmento} onChange={e => setForm(f => ({ ...f, segmento: e.target.value }))}
                        className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary bg-white">
                        {SEGMENTOS.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Setor</span>
                      <select value={form.setor} onChange={e => setForm(f => ({ ...f, setor: e.target.value as any }))}
                        className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary bg-white">
                        {SETORES.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Porte</span>
                      <select value={form.porte} onChange={e => setForm(f => ({ ...f, porte: e.target.value as any }))}
                        className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary bg-white">
                        {PORTES.map(p => <option key={p}>{p}</option>)}
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</span>
                      <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}
                        className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary bg-white">
                        {STATUS_LIST.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Faturamento Anual (R$)</span>
                      <input type="number" value={form.faturamento} onChange={e => setForm(f => ({ ...f, faturamento: e.target.value }))} placeholder="0"
                        className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all" />
                    </label>
                    <label className="block">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Colaboradores</span>
                      <input type="number" value={form.colaboradores} onChange={e => setForm(f => ({ ...f, colaboradores: e.target.value }))} placeholder="0"
                        className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all" />
                    </label>
                  </div>
                  <label className="block">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cidade</span>
                    <input type="text" value={form.cidade} onChange={e => setForm(f => ({ ...f, cidade: e.target.value }))} placeholder="Ex: Blumenau - SC"
                      className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all" />
                  </label>
                  <div className="border-t border-slate-100 pt-4">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Contato Principal</p>
                    <div className="space-y-3">
                      <input type="text" value={form.contato} onChange={e => setForm(f => ({ ...f, contato: e.target.value }))} placeholder="Nome do contato"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all" />
                      <div className="grid grid-cols-2 gap-3">
                        <input type="email" value={form.email_contato} onChange={e => setForm(f => ({ ...f, email_contato: e.target.value }))} placeholder="E-mail"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all" />
                        <input type="text" value={form.tel} onChange={e => setForm(f => ({ ...f, tel: e.target.value }))} placeholder="Telefone"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all" />
                      </div>
                    </div>
                  </div>
                  {erro && <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">{erro}</div>}
                </div>
                <div className="flex items-center justify-between p-6 border-t border-slate-100">
                  <div>
                    {editingId && (
                      <button onClick={() => setConfirmDelete(true)}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-all">
                        <Trash2 size={14} />Excluir
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-all">Cancelar</button>
                    <button onClick={handleSave} disabled={saving}
                      className="flex items-center gap-2 px-5 py-2 bg-unifique-primary text-white text-sm font-bold rounded-lg hover:bg-unifique-primary/90 disabled:opacity-60 transition-all">
                      {saving && <Loader2 size={14} className="animate-spin" />}
                      {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Cadastrar Empresa'}
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
