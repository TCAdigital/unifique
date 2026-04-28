"use client";

import React, { useEffect, useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { supabase } from '@/lib/supabase';
import { Empresa } from '@/types';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Building2,
  ArrowUpDown,
  X,
  Loader2,
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
  nome: '',
  segmento: 'Tecnologia',
  setor: 'Privado' as const,
  porte: 'Médio' as const,
  status: 'Lead' as const,
  faturamento: '',
  colaboradores: '',
  cidade: '',
  contato: '',
  email_contato: '',
  tel: '',
};

export default function EmpresasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');

  async function fetchEmpresas() {
    const { data } = await supabase
      .from('empresas')
      .select('*')
      .order('nome', { ascending: true });
    if (data) setEmpresas(data);
    setLoading(false);
  }

  useEffect(() => { fetchEmpresas(); }, []);

  const filteredEmpresas = empresas.filter(e =>
    e.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.segmento.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function openModal() {
    setForm(BLANK_FORM);
    setErro('');
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.nome.trim()) { setErro('O nome da empresa é obrigatório.'); return; }
    if (!form.segmento) { setErro('Selecione um segmento.'); return; }
    setSaving(true);
    setErro('');

    const payload = {
      nome: form.nome.trim(),
      segmento: form.segmento,
      setor: form.setor,
      porte: form.porte,
      status: form.status,
      faturamento: parseFloat(form.faturamento) || 0,
      colaboradores: parseInt(form.colaboradores) || 0,
      cidade: form.cidade.trim() || null,
      contato: form.contato.trim() || null,
      email_contato: form.email_contato.trim() || null,
      tel: form.tel.trim() || null,
    };

    const { error } = await supabase.from('empresas').insert([payload]);
    setSaving(false);

    if (error) {
      setErro('Erro ao salvar: ' + error.message);
      return;
    }

    setShowModal(false);
    setLoading(true);
    fetchEmpresas();
  }

  return (
    <Shell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-outfit text-slate-900">Gestão de Empresas</h1>
            <p className="text-sm text-slate-500">Visualize e gerencie as contas corporativas da Unifique.</p>
          </div>
          <button
            onClick={openModal}
            className="flex items-center gap-2 px-4 py-2 bg-unifique-primary text-white rounded-xl font-bold shadow-lg shadow-unifique-primary/20 hover:scale-[1.02] transition-all"
          >
            <Plus size={18} />
            Nova Empresa
          </button>
        </div>

        {/* Filters & Search */}
        <div className="glass-card p-4 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nome ou segmento..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-unifique-primary/50 transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all">
              <Filter size={16} />
              Filtros
            </button>
            <button className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all">
              <ArrowUpDown size={16} />
              Ordenar
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="glass-card overflow-hidden">
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-4">
              <div className="w-8 h-8 border-4 border-unifique-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-500 animate-pulse font-medium">Carregando dados...</p>
            </div>
          ) : filteredEmpresas.length > 0 ? (
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
                  {filteredEmpresas.map((empresa, idx) => (
                    <motion.tr
                      key={empresa.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="hover:bg-slate-50 transition-all group cursor-pointer"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-unifique-primary/10 flex items-center justify-center text-unifique-primary">
                            <Building2 size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-slate-900">{empresa.nome}</p>
                            <p className="text-[10px] text-slate-500">{empresa.setor}{empresa.cidade ? ` · ${empresa.cidade}` : ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {empresa.segmento}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-mono text-sm font-bold text-slate-700">
                          {formatCurrency(empresa.faturamento)}
                        </span>
                      </td>
                      <td className="p-4 text-center text-sm text-slate-600">
                        {empresa.colaboradores}
                      </td>
                      <td className="p-4">
                        <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold", STATUS_COLORS[empresa.status] ?? STATUS_COLORS.Lead)}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {empresa.status ?? 'Ativo'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button className="p-2 text-slate-400 hover:text-unifique-primary transition-colors">
                          <MoreHorizontal size={18} />
                        </button>
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
              <button onClick={openModal} className="mt-4 text-unifique-primary text-sm font-bold hover:underline">
                Cadastrar primeira empresa
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal Nova Empresa */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,24,64,0.45)', backdropFilter: 'blur(4px)' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Nova Empresa</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-all">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <label className="block">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nome da Empresa *</span>
                  <input
                    type="text"
                    value={form.nome}
                    onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                    placeholder="Ex: Acme Tecnologia LTDA"
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all"
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Segmento *</span>
                    <select
                      value={form.segmento}
                      onChange={e => setForm(f => ({ ...f, segmento: e.target.value }))}
                      className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all bg-white"
                    >
                      {SEGMENTOS.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Setor</span>
                    <select
                      value={form.setor}
                      onChange={e => setForm(f => ({ ...f, setor: e.target.value as any }))}
                      className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all bg-white"
                    >
                      {SETORES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Porte</span>
                    <select
                      value={form.porte}
                      onChange={e => setForm(f => ({ ...f, porte: e.target.value as any }))}
                      className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all bg-white"
                    >
                      {PORTES.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</span>
                    <select
                      value={form.status}
                      onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}
                      className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all bg-white"
                    >
                      {STATUS_LIST.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Faturamento Anual (R$)</span>
                    <input
                      type="number"
                      value={form.faturamento}
                      onChange={e => setForm(f => ({ ...f, faturamento: e.target.value }))}
                      placeholder="0"
                      className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Colaboradores</span>
                    <input
                      type="number"
                      value={form.colaboradores}
                      onChange={e => setForm(f => ({ ...f, colaboradores: e.target.value }))}
                      placeholder="0"
                      className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cidade</span>
                  <input
                    type="text"
                    value={form.cidade}
                    onChange={e => setForm(f => ({ ...f, cidade: e.target.value }))}
                    placeholder="Ex: São Paulo - SP"
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all"
                  />
                </label>

                <div className="border-t border-slate-100 pt-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Contato Principal</p>
                  <div className="grid grid-cols-1 gap-3">
                    <label className="block">
                      <span className="text-xs text-slate-500">Nome do contato</span>
                      <input
                        type="text"
                        value={form.contato}
                        onChange={e => setForm(f => ({ ...f, contato: e.target.value }))}
                        placeholder="Ex: João da Silva"
                        className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all"
                      />
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="block">
                        <span className="text-xs text-slate-500">E-mail</span>
                        <input
                          type="email"
                          value={form.email_contato}
                          onChange={e => setForm(f => ({ ...f, email_contato: e.target.value }))}
                          placeholder="contato@empresa.com"
                          className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all"
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs text-slate-500">Telefone</span>
                        <input
                          type="text"
                          value={form.tel}
                          onChange={e => setForm(f => ({ ...f, tel: e.target.value }))}
                          placeholder="(11) 99999-9999"
                          className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

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
                {saving ? 'Salvando...' : 'Cadastrar Empresa'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </Shell>
  );
}
