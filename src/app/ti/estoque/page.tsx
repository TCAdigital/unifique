"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Shell } from '@/components/layout/Shell';
import {
  Package, Search, Plus, AlertTriangle, ArrowRightLeft, X,
  Loader2, Edit2, Calendar, AlertCircle,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';

interface ItemEstoque {
  id: string;
  nome: string;
  tipo: string;
  qtd_estoque: number;
  qtd_min: number;
  custo_unit: number;
  fornecedor?: string;
  sku?: string;
  capex_opex?: string;
  vigencia_garantia?: string;
  nfe_fornecedor?: string;
  sc_po?: string;
  obs?: string;
}

const CATEGORIAS = [
  'Hardware', 'Software', 'Network', 'Infraestrutura',
  'Segurança', 'Cabeamento', 'Celular', 'FWA', 'Outro',
];

const BLANK_FORM = {
  nome: '',
  tipo: 'Hardware',
  qtd: '1',
  min: '1',
  valor: '',
  fornecedor: '',
  sku: '',
  capex_opex: 'CAPEX',
  vigencia_garantia: '',
  nfe_fornecedor: '',
  sc_po: '',
  obs: '',
};

function diasAteVencer(dataStr?: string): number | null {
  if (!dataStr) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const venc = new Date(dataStr);
  return Math.ceil((venc.getTime() - hoje.getTime()) / 86400000);
}

function GarantiaChip({ data }: { data?: string }) {
  const dias = diasAteVencer(data);
  if (dias === null) return <span className="text-xs text-slate-400">—</span>;
  if (dias < 0) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">Expirado</span>;
  if (dias <= 30) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700"><AlertCircle size={10} /> {dias}d</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">{new Date(data!).toLocaleDateString('pt-BR')}</span>;
}

export default function TiEstoquePage() {
  const [estoque, setEstoque] = useState<ItemEstoque[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(BLANK_FORM);
  const [erro, setErro] = useState('');
  const [saving, setSaving] = useState(false);
  const [abaFiltro, setAbaFiltro] = useState<'todos' | 'expirando'>('todos');

  async function loadData() {
    const { data } = await supabase
      .from('ti_itens')
      .select('id, nome, tipo, qtd_estoque, qtd_min, custo_unit, fornecedor, sku, capex_opex, vigencia_garantia, nfe_fornecedor, sc_po, obs')
      .order('nome');
    setEstoque((data ?? []) as ItemEstoque[]);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  const filtered = useMemo(() => {
    let list = estoque;
    if (abaFiltro === 'expirando') {
      list = list.filter(i => {
        const d = diasAteVencer(i.vigencia_garantia);
        return d !== null && d <= 90;
      });
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(i =>
        i.nome.toLowerCase().includes(q) ||
        (i.tipo ?? '').toLowerCase().includes(q) ||
        (i.sku ?? '').toLowerCase().includes(q) ||
        (i.fornecedor ?? '').toLowerCase().includes(q) ||
        (i.sc_po ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [estoque, searchTerm, abaFiltro]);

  const itensAlerta = estoque.filter(i => i.qtd_estoque <= i.qtd_min).length;
  const patrimonio = estoque.reduce((s, i) => s + (i.custo_unit ?? 0) * (i.qtd_estoque ?? 0), 0);
  const expirandoEm90 = estoque.filter(i => {
    const d = diasAteVencer(i.vigencia_garantia);
    return d !== null && d <= 90;
  }).length;

  function openCreate() {
    setEditId(null);
    setForm(BLANK_FORM);
    setErro('');
    setShowModal(true);
  }

  function openEdit(item: ItemEstoque) {
    setEditId(item.id);
    setForm({
      nome: item.nome,
      tipo: item.tipo ?? 'Hardware',
      qtd: String(item.qtd_estoque ?? 1),
      min: String(item.qtd_min ?? 1),
      valor: String(item.custo_unit ?? ''),
      fornecedor: item.fornecedor ?? '',
      sku: item.sku ?? '',
      capex_opex: item.capex_opex ?? 'CAPEX',
      vigencia_garantia: item.vigencia_garantia ?? '',
      nfe_fornecedor: item.nfe_fornecedor ?? '',
      sc_po: item.sc_po ?? '',
      obs: item.obs ?? '',
    });
    setErro('');
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.nome.trim()) { setErro('Nome do item é obrigatório.'); return; }
    setSaving(true);
    setErro('');

    const payload: Record<string, unknown> = {
      nome: form.nome.trim(),
      tipo: form.tipo,
      qtd_estoque: parseInt(form.qtd) || 0,
      qtd_min: parseInt(form.min) || 0,
      custo_unit: parseFloat(form.valor) || 0,
      fornecedor: form.fornecedor.trim() || null,
      sku: form.sku.trim() || null,
      capex_opex: form.capex_opex,
      vigencia_garantia: form.vigencia_garantia || null,
      nfe_fornecedor: form.nfe_fornecedor.trim() || null,
      sc_po: form.sc_po.trim() || null,
      obs: form.obs.trim() || null,
    };

    let error;
    if (editId) {
      ({ error } = await supabase.from('ti_itens').update(payload).eq('id', editId));
    } else {
      payload.id = String(Date.now());
      ({ error } = await supabase.from('ti_itens').insert(payload));
    }

    setSaving(false);
    if (error) { setErro('Erro ao salvar: ' + error.message); return; }
    setShowModal(false);
    loadData();
  }

  function f(field: keyof typeof BLANK_FORM, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-outfit text-slate-900">Estoque TIC</h1>
            <p className="text-sm text-slate-500">Gestão de hardware, software e infraestrutura.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-unifique-primary text-white rounded-xl font-bold shadow-lg shadow-unifique-primary/20 hover:scale-[1.02] transition-all"
            >
              <Plus size={18} />
              Novo Item
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card p-4 border-l-4 border-l-red-500">
            <div className="flex items-center gap-3 mb-1">
              <AlertTriangle className="text-red-500" size={18} />
              <span className="text-xs font-bold text-red-700 uppercase tracking-wider">Estoque Baixo</span>
            </div>
            <p className="text-lg font-bold text-slate-900">{itensAlerta} {itensAlerta === 1 ? 'item crítico' : 'itens críticos'}</p>
          </div>
          <div className="glass-card p-4 border-l-4 border-l-amber-500">
            <div className="flex items-center gap-3 mb-1">
              <Calendar className="text-amber-600" size={18} />
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Garantias Expirando</span>
            </div>
            <p className="text-lg font-bold text-slate-900">{expirandoEm90} {expirandoEm90 === 1 ? 'item' : 'itens'} ≤ 90 dias</p>
          </div>
          <div className="glass-card p-4 border-l-4 border-l-unifique-primary">
            <div className="flex items-center gap-3 mb-1">
              <Package className="text-unifique-primary" size={18} />
              <span className="text-xs font-bold text-unifique-primary uppercase tracking-wider">Total Patrimônio</span>
            </div>
            <p className="text-lg font-bold text-slate-900">{formatCurrency(patrimonio)}</p>
          </div>
        </div>

        {/* Filtros + busca */}
        <div className="glass-card p-4 flex flex-col md:flex-row gap-3 items-start md:items-center">
          <div className="flex rounded-lg border border-slate-200 overflow-hidden flex-shrink-0">
            {(['todos', 'expirando'] as const).map(aba => (
              <button
                key={aba}
                onClick={() => setAbaFiltro(aba)}
                className={cn(
                  'px-4 py-1.5 text-xs font-bold transition-all',
                  abaFiltro === aba ? 'bg-unifique-primary text-white' : 'text-slate-600 hover:bg-slate-50'
                )}
              >
                {aba === 'todos' ? 'Todos' : 'Expirando (90d)'}
              </button>
            ))}
          </div>
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Buscar por nome, SKU, fornecedor, SC/PO..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-unifique-primary/50 transition-all text-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Tabela */}
        <div className="glass-card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Package size={16} className="text-unifique-primary" />
              <span className="text-sm font-bold text-slate-700">{filtered.length} item{filtered.length !== 1 ? 's' : ''}</span>
            </div>
            <span className="text-xs text-slate-400">{estoque.length} total cadastrados</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Item / SKU</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Categoria</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Fornecedor / NFe</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">SC/PO</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Tipo</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Qtd</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Custo Unit.</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Garantia</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-slate-400 text-sm">
                      <Loader2 className="animate-spin mx-auto mb-2" size={20} />
                      Carregando...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-slate-400 text-sm">Nenhum item encontrado.</td>
                  </tr>
                ) : filtered.map((item, idx) => {
                  const isLow = item.qtd_estoque <= item.qtd_min;
                  const dias = diasAteVencer(item.vigencia_garantia);
                  const garantiaAlerta = dias !== null && dias <= 30;
                  return (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className={cn('hover:bg-slate-50 transition-all', garantiaAlerta && 'bg-amber-50/30')}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', isLow ? 'bg-red-100 text-red-500' : 'bg-unifique-primary/10 text-unifique-primary')}>
                            <Package size={18} />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-slate-900">{item.nome}</p>
                            {item.sku && <p className="text-[10px] text-slate-400 font-mono">{item.sku}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-600">
                          {item.tipo}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-slate-700">{item.fornecedor || '—'}</p>
                        {item.nfe_fornecedor && <p className="text-[10px] text-slate-400">NFe: {item.nfe_fornecedor}</p>}
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-xs text-slate-600 font-mono">{item.sc_po || '—'}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={cn('inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold', item.capex_opex === 'OPEX' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700')}>
                          {item.capex_opex ?? 'CAPEX'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={cn('text-sm font-bold', isLow ? 'text-red-500' : 'text-slate-900')}>{item.qtd_estoque}</span>
                        <p className="text-[10px] text-slate-400">mín {item.qtd_min}</p>
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-mono text-sm font-bold text-slate-700">{formatCurrency(item.custo_unit ?? 0)}</span>
                      </td>
                      <td className="p-4 text-center">
                        <GarantiaChip data={item.vigencia_garantia} />
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => openEdit(item)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-unifique-primary transition-all"
                          title="Editar"
                        >
                          <Edit2 size={15} />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Novo / Editar Item */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,24,64,0.45)', backdropFilter: 'blur(4px)' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-100 flex-shrink-0">
              <h2 className="text-lg font-bold text-slate-900">{editId ? 'Editar Item' : 'Novo Item de Estoque'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-all">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Identificação */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Identificação</p>
                <div className="space-y-3">
                  <label className="block">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nome do Item *</span>
                    <input
                      type="text"
                      value={form.nome}
                      onChange={e => f('nome', e.target.value)}
                      placeholder="Ex: Switch Cisco 24 portas"
                      className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all"
                      autoFocus
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Categoria</span>
                      <select
                        value={form.tipo}
                        onChange={e => f('tipo', e.target.value)}
                        className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all bg-white"
                      >
                        {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Serial / PN / SKU</span>
                      <input
                        type="text"
                        value={form.sku}
                        onChange={e => f('sku', e.target.value)}
                        placeholder="Ex: FG-60F-BDL-950-12"
                        className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all font-mono"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Fornecedor e Compra */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Fornecedor e Compra</p>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fornecedor</span>
                      <input
                        type="text"
                        value={form.fornecedor}
                        onChange={e => f('fornecedor', e.target.value)}
                        placeholder="Ex: Fortinet Brasil"
                        className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nº NFe Fornecedor</span>
                      <input
                        type="text"
                        value={form.nfe_fornecedor}
                        onChange={e => f('nfe_fornecedor', e.target.value)}
                        placeholder="Ex: 000123456"
                        className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all font-mono"
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nº SC/PO</span>
                      <input
                        type="text"
                        value={form.sc_po}
                        onChange={e => f('sc_po', e.target.value)}
                        placeholder="Ex: SC-2026-0042"
                        className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all font-mono"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo de Custo</span>
                      <div className="mt-1 flex gap-3">
                        {(['CAPEX', 'OPEX'] as const).map(tipo => (
                          <label key={tipo} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="capex_opex"
                              value={tipo}
                              checked={form.capex_opex === tipo}
                              onChange={() => f('capex_opex', tipo)}
                              className="accent-unifique-primary"
                            />
                            <span className="text-sm font-bold text-slate-700">{tipo}</span>
                          </label>
                        ))}
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Quantidades e Valor */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Quantidades e Valor</p>
                <div className="grid grid-cols-3 gap-3">
                  <label className="block">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quantidade</span>
                    <input
                      type="number"
                      min="0"
                      value={form.qtd}
                      onChange={e => f('qtd', e.target.value)}
                      className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estoque Mínimo</span>
                    <input
                      type="number"
                      min="0"
                      value={form.min}
                      onChange={e => f('min', e.target.value)}
                      className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Custo Unit. (R$)</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.valor}
                      onChange={e => f('valor', e.target.value)}
                      placeholder="0,00"
                      className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all"
                    />
                  </label>
                </div>
              </div>

              {/* Garantia */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Suporte e Garantia</p>
                <label className="block">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vigência de Suporte / Garantia</span>
                  <input
                    type="date"
                    value={form.vigencia_garantia}
                    onChange={e => f('vigencia_garantia', e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all"
                  />
                  {form.vigencia_garantia && (() => {
                    const d = diasAteVencer(form.vigencia_garantia);
                    if (d === null) return null;
                    const meses = Math.round(d / 30);
                    const cor = d < 0 ? 'text-red-600' : d <= 90 ? 'text-amber-600' : 'text-emerald-600';
                    return (
                      <p className={cn('text-xs mt-1 font-medium', cor)}>
                        {d < 0 ? `Expirou ${Math.abs(d)} dias atrás` : `${d} dias restantes (≈ ${meses} meses)`}
                      </p>
                    );
                  })()}
                </label>
              </div>

              {/* Observações */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Observações</p>
                <textarea
                  value={form.obs}
                  onChange={e => f('obs', e.target.value)}
                  rows={2}
                  placeholder="Informações adicionais..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all resize-none"
                />
              </div>

              {erro && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">{erro}</div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-100 flex-shrink-0">
              <button onClick={() => { setShowModal(false); setErro(''); }} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-unifique-primary text-white text-sm font-bold rounded-lg hover:bg-unifique-primary/90 disabled:opacity-60 transition-all"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {saving ? 'Salvando...' : editId ? 'Salvar alterações' : 'Adicionar ao Estoque'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </Shell>
  );
}
