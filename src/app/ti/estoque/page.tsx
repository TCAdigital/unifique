"use client";

import React, { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { 
  Package, 
  Search, 
  Plus, 
  AlertTriangle, 
  ArrowRightLeft,
  Filter,
  MoreHorizontal
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';

const MOCK_ESTOQUE = [
  { id: '1', item: 'Notebook Dell Latitude', cat: 'Hardware', qtd: 12, min: 5, valor: 4500 },
  { id: '2', item: 'Monitor 24" LG', cat: 'Hardware', qtd: 8, min: 10, valor: 900 },
  { id: '3', item: 'Licença Office 365 BP', cat: 'Software', qtd: 50, min: 20, valor: 85 },
  { id: '4', item: 'Firewall Fortigate', cat: 'Network', qtd: 3, min: 2, valor: 8500 },
  { id: '5', item: 'Switch 24 Portas', cat: 'Network', qtd: 1, min: 3, valor: 1200 },
];

export default function TiEstoquePage() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <Shell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-outfit text-slate-900 dark:text-white">Estoque TIC</h1>
            <p className="text-sm text-slate-500">Gestão de hardware, software e infraestrutura.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
              <ArrowRightLeft size={18} />
              Movimentação
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-unifique-primary text-white rounded-xl font-bold shadow-lg shadow-unifique-primary/20 hover:scale-[1.02] transition-all">
              <Plus size={18} />
              Novo Item
            </button>
          </div>
        </div>

        {/* Alerts Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card p-4 border-l-4 border-l-red-500 bg-red-50 dark:bg-red-900/10">
            <div className="flex items-center gap-3 mb-1">
              <AlertTriangle className="text-red-500" size={18} />
              <span className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider">Atenção: Estoque Baixo</span>
            </div>
            <p className="text-lg font-bold text-slate-900 dark:text-white">2 Itens críticos</p>
          </div>
          <div className="glass-card p-4 border-l-4 border-l-unifique-primary">
            <div className="flex items-center gap-3 mb-1">
              <Package className="text-unifique-primary" size={18} />
              <span className="text-xs font-bold text-unifique-primary uppercase tracking-wider">Total em Patrimônio</span>
            </div>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(125000)}</p>
          </div>
          <div className="glass-card p-4 border-l-4 border-l-unifique-success">
            <div className="flex items-center gap-3 mb-1">
              <ArrowRightLeft className="text-unifique-success" size={18} />
              <span className="text-xs font-bold text-unifique-success uppercase tracking-wider">Movimentações Hoje</span>
            </div>
            <p className="text-lg font-bold text-slate-900 dark:text-white">14 saídas</p>
          </div>
        </div>

        {/* Search */}
        <div className="glass-card p-4 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar item, categoria ou ID..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg outline-none focus:border-unifique-primary/50 transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 border border-slate-200 dark:border-white/10 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
            <Filter size={16} />
            Filtros
          </button>
        </div>

        {/* Inventory Table */}
        <div className="glass-card overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5">
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Item / Descrição</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Categoria</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Quantidade</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Custo Unit.</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                <th className="p-4 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/10">
              {MOCK_ESTOQUE.map((item, idx) => {
                const isLow = item.qtd <= item.min;
                return (
                  <motion.tr 
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-slate-50 dark:hover:bg-white/5 transition-all group"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", isLow ? "bg-red-500/10 text-red-500" : "bg-unifique-primary/10 text-unifique-primary")}>
                          <Package size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-900 dark:text-white">{item.item}</p>
                          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">ID: {item.id.padStart(4, '0')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-400">
                        {item.cat}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className={cn("text-sm font-bold", isLow ? "text-red-500" : "text-slate-900 dark:text-white")}>{item.qtd}</span>
                        <span className="text-[9px] text-slate-400">min: {item.min}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-mono text-sm font-bold text-slate-700 dark:text-slate-300">
                        {formatCurrency(item.valor)}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        isLow ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"
                      )}>
                        {isLow ? 'Repor' : 'OK'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button className="p-2 text-slate-400 hover:text-unifique-primary transition-colors">
                        <MoreHorizontal size={18} />
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Shell>
  );
}
