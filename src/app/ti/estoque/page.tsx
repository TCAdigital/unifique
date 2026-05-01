"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shell } from '@/components/layout/Shell';
import { Package, Search, Plus, AlertTriangle, ArrowRightLeft, X, Loader2 } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ItemEstoque {
  id: string;
  item: string;
  cat: string;
  qtd: number;
  min: number;
  valor: number;
}

const ESTOQUE_INITIAL: ItemEstoque[] = [
  { id: '1', item: 'Notebook Dell Latitude', cat: 'Hardware', qtd: 12, min: 5, valor: 4500 },
  { id: '2', item: 'Monitor 24" LG', cat: 'Hardware', qtd: 8, min: 10, valor: 900 },
  { id: '3', item: 'Licença Office 365 BP', cat: 'Software', qtd: 50, min: 20, valor: 85 },
  { id: '4', item: 'Firewall Fortigate', cat: 'Network', qtd: 3, min: 2, valor: 8500 },
  { id: '5', item: 'Switch 24 Portas', cat: 'Network', qtd: 1, min: 3, valor: 1200 },
];

const CATEGORIAS = ['Hardware', 'Software', 'Network', 'Infraestrutura', 'Segurança', 'Cabeamento', 'Outro'];

const BLANK_FORM = {
  item: '',
  cat: 'Hardware',
  qtd: '1',
  min: '2',
  valor: '',
};

export default function TiEstoquePage() {
  const router = useRouter();
  const [estoque, setEstoque] = useState<ItemEstoque[]>(ESTOQUE_INITIAL);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const [erro, setErro] = useState('');
  const [saving, setSaving] = useState(false);

  const filtered = estoque.filter(i =>
    i.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.cat.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const itensAlerta = estoque.filter(i => i.qtd <= i.min).length;
  const patrimonio = estoque.reduce((s, i) => s + i.valor * i.qtd, 0);

  function openModal() {
    setForm(BLANK_FORM);
    setErro('');
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.item.trim()) { setErro('Nome do item é obrigatório.'); return; }
    setSaving(true);
    await new Promise(r => setTimeout(r, 300));
    const novo: ItemEstoque = {
      id: String(Date.now()),
      item: form.item.trim(),
      cat: form.cat,
      qtd: parseInt(form.qtd) || 0,
      min: parseInt(form.min) || 0,
      valor: parseFloat(form.valor) || 0,
    };
    setEstoque(prev => [...prev, novo]);
    setSaving(false);
    setShowModal(false);
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
              onClick={() => router.push('/ti/movs')}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
            >
              <ArrowRightLeft size={18} />
              Movimentação
            </button>
            <button
              onClick={openModal}
              className="flex items-center gap-2 px-4 py-2 bg-unifique-primary text-white rounded-xl font-bold shadow-lg shadow-unifique-primary/20 hover:scale-[1.02] transition-all"
            >
              <Plus size={18} />
              Novo Item
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card p-4 border-l-4 border-l-red-500 bg-red-50">
            <div className="flex items-center gap-3 mb-1">
              <AlertTriangle className="text-red-500" size={18} />
              <span className="text-xs font-bold text-red-700 uppercase tracking-wider">Estoque Baixo</span>
            </div>
            <p className="text-lg font-bold text-slate-900">{itensAlerta} {itensAlerta === 1 ? 'item crítico' : 'itens críticos'}</p>
          </div>
          <div className="glass-card p-4 border-l-4 border-l-unifique-primary">
            <div className="flex items-center gap-3 mb-1">
              <Package className="text-unifique-primary" size={18} />
              <span className="text-xs font-bold text-unifique-primary uppercase tracking-wider">Total em Patrimônio</span>
            </div>
            <p className="text-lg font-bold text-slate-900">{formatCurrency(patrimonio)}</p>
          </div>
          <div className="glass-card p-4 border-l-4 border-l-unifique-success">
            <div className="flex items-center gap-3 mb-1">
              <Package className="text-unifique-success" size={18} />
              <span className="text-xs font-bold text-unifique-success uppercase tracking-wider">Total de Itens</span>
            </div>
            <p className="text-lg font-bold text-slate-900">{estoque.length} SKUs</p>
          </div>
        </div>

        <div className="glass-card p-4 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar item ou categoria..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-unifique-primary/50 transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="glass-card overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Item</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Categoria</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Qtd</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Custo Unit.</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.map((item, idx) => {
                const isLow = item.qtd <= item.min;
                return (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="hover:bg-slate-50 transition-all"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", isLow ? "bg-red-500/10 text-red-500" : "bg-unifique-primary/10 text-unifique-primary")}>
                          <Package size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-900">{item.item}</p>
                          <p className="text-[10px] text-slate-500 uppercase font-bold">mín: {item.min} un.</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-600">
                        {item.cat}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={cn("text-sm font-bold", isLow ? "text-red-500" : "text-slate-900")}>{item.qtd}</span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-mono text-sm font-bold text-slate-700">{formatCurrency(item.valor)}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase", isLow ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500")}>
                        {isLow ? 'Repor' : 'OK'}
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-400 text-sm">Nenhum item encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Novo Item */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,24,64,0.45)', backdropFilter: 'blur(4px)' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Novo Item de Estoque</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-all">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <label className="block">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nome do Item *</span>
                <input
                  type="text"
                  value={form.item}
                  onChange={e => setForm(f => ({ ...f, item: e.target.value }))}
                  placeholder="Ex: Firewall Fortinet 60F"
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all"
                  autoFocus
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Categoria</span>
                  <select
                    value={form.cat}
                    onChange={e => setForm(f => ({ ...f, cat: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all bg-white"
                  >
                    {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Custo Unit. (R$)</span>
                  <input
                    type="number"
                    value={form.valor}
                    onChange={e => setForm(f => ({ ...f, valor: e.target.value }))}
                    placeholder="0,00"
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quantidade Inicial</span>
                  <input
                    type="number"
                    min="0"
                    value={form.qtd}
                    onChange={e => setForm(f => ({ ...f, qtd: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estoque Mínimo</span>
                  <input
                    type="number"
                    min="0"
                    value={form.min}
                    onChange={e => setForm(f => ({ ...f, min: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all"
                  />
                </label>
              </div>

              {erro && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">{erro}</div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-100">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-unifique-primary text-white text-sm font-bold rounded-lg hover:bg-unifique-primary/90 disabled:opacity-60 transition-all"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {saving ? 'Salvando...' : 'Adicionar ao Estoque'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </Shell>
  );
}
