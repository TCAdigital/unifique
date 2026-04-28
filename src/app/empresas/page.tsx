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
  Users, 
  DollarSign,
  ArrowUpDown
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function EmpresasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchEmpresas() {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .order('nome', { ascending: true });

      if (data) setEmpresas(data);
      setLoading(false);
    }
    fetchEmpresas();
  }, []);

  const filteredEmpresas = empresas.filter(e => 
    e.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.segmento.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Shell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-outfit text-slate-900 dark:text-white">Gestão de Empresas</h1>
            <p className="text-sm text-slate-500">Visualize e gerencie as contas corporativas da Unifique.</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-unifique-primary text-white rounded-xl font-bold shadow-lg shadow-unifique-primary/20 hover:scale-[1.02] transition-all">
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
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg outline-none focus:border-unifique-primary/50 transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button className="flex items-center gap-2 px-3 py-2 border border-slate-200 dark:border-white/10 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
              <Filter size={16} />
              Filtros
            </button>
            <button className="flex items-center gap-2 px-3 py-2 border border-slate-200 dark:border-white/10 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
              <ArrowUpDown size={16} />
              Ordenar
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="glass-card overflow-hidden">
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-4">
              <div className="w-8 h-8 border-4 border-unifique-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-500 animate-pulse font-medium">Carregando dados do Supabase...</p>
            </div>
          ) : filteredEmpresas.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5">
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Empresa</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Segmento</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Faturamento</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Colaboradores</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="p-4 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                  {filteredEmpresas.map((empresa, idx) => (
                    <motion.tr 
                      key={empresa.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="hover:bg-slate-50 dark:hover:bg-white/5 transition-all group cursor-pointer"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-unifique-primary/10 flex items-center justify-center text-unifique-primary">
                            <Building2 size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-slate-900 dark:text-white">{empresa.nome}</p>
                            <p className="text-[10px] text-slate-500">{empresa.setor} · ID: {empresa.id.slice(0,8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                          {empresa.segmento}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-mono text-sm font-bold text-slate-700 dark:text-slate-300">
                          {formatCurrency(empresa.faturamento)}
                        </span>
                      </td>
                      <td className="p-4 text-center text-sm text-slate-600 dark:text-slate-400">
                        {empresa.colaboradores}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-unifique-success" />
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Ativa</span>
                        </div>
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
              <p className="text-slate-500">Nenhuma empresa encontrada.</p>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
