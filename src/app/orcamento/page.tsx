"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Shell } from "@/components/layout/Shell";
import { supabase } from "@/lib/supabase";
import { formatCurrency, cn } from "@/lib/utils";
import type { Orcamento } from "@/types";
import {
  Wallet,
  Plus,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  ChevronDown,
} from "lucide-react";

const CATEGORIAS = [
  "Eventos",
  "Visitas",
  "Almoço/Jantar",
  "Ferramentas",
  "Marketing Digital",
  "Brindes",
  "Outros",
] as const;

const STATUS_CONFIG = {
  Planejado: { color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20", icon: Clock },
  Executado: { color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20", icon: CheckCircle2 },
  Pendente: { color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20", icon: Clock },
  Cancelado: { color: "text-red-500 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/20", icon: XCircle },
};

const CAT_COLORS: Record<string, string> = {
  Eventos: "bg-purple-100 text-purple-700",
  Visitas: "bg-blue-100 text-blue-700",
  "Almoço/Jantar": "bg-orange-100 text-orange-700",
  Ferramentas: "bg-cyan-100 text-cyan-700",
  "Marketing Digital": "bg-pink-100 text-pink-700",
  Brindes: "bg-yellow-100 text-yellow-700",
  Outros: "bg-slate-100 text-slate-600",
};

const PERIODOS = Array.from({ length: 6 }, (_, i) => {
  const d = new Date();
  d.setMonth(d.getMonth() - i);
  return d.toISOString().slice(0, 7);
});

interface FormData {
  categoria: string;
  descricao: string;
  orcamento: string;
  gasto: string;
  status: string;
  periodo: string;
}

const EMPTY_FORM: FormData = {
  categoria: "Eventos",
  descricao: "",
  orcamento: "",
  gasto: "",
  status: "Planejado",
  periodo: PERIODOS[0],
};

export default function OrcamentoPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Orcamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [periodoFiltro, setPeriodoFiltro] = useState(PERIODOS[0]);

  useEffect(() => {
    loadData();
  }, [periodoFiltro]);

  async function loadData() {
    setLoading(true);
    const { data } = await supabase
      .from("orcamentos")
      .select("*")
      .like("periodo", `${periodoFiltro}%`)
      .order("created_at", { ascending: false });
    setItems((data as Orcamento[]) ?? []);
    setLoading(false);
  }

  async function handleSave() {
    if (!form.descricao || !form.orcamento) return;
    setSaving(true);
    await supabase.from("orcamentos").insert({
      consultor_id: user?.id ?? null,
      periodo: `${form.periodo}-01`,
      categoria: form.categoria,
      descricao: form.descricao,
      orcamento: parseFloat(form.orcamento) || 0,
      gasto: parseFloat(form.gasto) || 0,
      status: form.status,
    });
    setForm(EMPTY_FORM);
    setShowForm(false);
    setSaving(false);
    loadData();
  }

  const totalOrcado = items.reduce((s, i) => s + i.orcamento, 0);
  const totalGasto = items.reduce((s, i) => s + i.gasto, 0);
  const saldo = totalOrcado - totalGasto;
  const pctGasto = totalOrcado > 0 ? Math.round((totalGasto / totalOrcado) * 100) : 0;

  return (
    <Shell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-outfit">
              Orçamento
            </h1>
            <p className="text-slate-500 mt-1">
              Controle de investimento em prospecção e eventos por período.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={periodoFiltro}
                onChange={(e) => setPeriodoFiltro(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-unifique-primary/30"
              >
                {PERIODOS.map((p) => (
                  <option key={p} value={p}>
                    {new Date(`${p}-02`).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2 bg-unifique-primary text-white rounded-xl text-sm font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-unifique-primary/25"
            >
              <Plus size={16} /> Novo Item
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Total Orçado", value: formatCurrency(totalOrcado), icon: Wallet, color: "text-unifique-primary", bg: "bg-unifique-primary/10" },
            { label: "Total Gasto", value: formatCurrency(totalGasto), icon: TrendingDown, color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20" },
            { label: "Saldo Disponível", value: formatCurrency(saldo), icon: TrendingUp, color: saldo >= 0 ? "text-emerald-600" : "text-red-500", bg: saldo >= 0 ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-red-50 dark:bg-red-900/20" },
            { label: "% Utilizado", value: `${pctGasto}%`, icon: CheckCircle2, color: pctGasto > 90 ? "text-red-500" : pctGasto > 70 ? "text-amber-500" : "text-emerald-600", bg: "bg-slate-50 dark:bg-slate-800" },
          ].map((k) => (
            <div key={k.label} className="glass-card p-5 flex items-center gap-4">
              <div className={cn("p-3 rounded-xl flex-shrink-0", k.bg)}>
                <k.icon size={20} className={k.color} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium truncate">{k.label}</p>
                <p className={cn("text-xl font-bold font-outfit truncate", k.color)}>
                  {loading ? "—" : k.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        {!loading && totalOrcado > 0 && (
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Execução do orçamento</span>
              <span className="text-sm font-bold text-unifique-primary">{pctGasto}%</span>
            </div>
            <div className="w-full h-3 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700",
                  pctGasto > 90 ? "bg-red-500" : pctGasto > 70 ? "bg-amber-500" : "bg-unifique-success"
                )}
                style={{ width: `${Math.min(pctGasto, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-[11px] text-slate-400">
              <span>R$ 0</span>
              <span>{formatCurrency(totalOrcado)}</span>
            </div>
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="glass-card p-6 border-2 border-unifique-primary/20">
            <h3 className="font-bold text-sm mb-4 text-unifique-primary">Novo Item de Orçamento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Categoria</label>
                <select
                  value={form.categoria}
                  onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 rounded-lg text-sm bg-white dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-unifique-primary/30"
                >
                  {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 rounded-lg text-sm bg-white dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-unifique-primary/30"
                >
                  {Object.keys(STATUS_CONFIG).map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Descrição *</label>
                <input
                  type="text"
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  placeholder="Ex: Evento TIC Summit SP"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 rounded-lg text-sm bg-white dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-unifique-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Valor Orçado (R$) *</label>
                <input
                  type="number"
                  value={form.orcamento}
                  onChange={(e) => setForm({ ...form, orcamento: e.target.value })}
                  placeholder="0,00"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 rounded-lg text-sm bg-white dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-unifique-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Valor Gasto (R$)</label>
                <input
                  type="number"
                  value={form.gasto}
                  onChange={(e) => setForm({ ...form, gasto: e.target.value })}
                  placeholder="0,00"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 rounded-lg text-sm bg-white dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-unifique-primary/30"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-unifique-primary text-white rounded-lg text-sm font-bold hover:bg-unifique-primary/90 disabled:opacity-60 transition-all"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Salvar
              </button>
              <button
                onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
                className="px-5 py-2 border border-slate-200 dark:border-white/10 rounded-lg text-sm font-bold hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5">
            <h2 className="font-bold text-sm">
              Itens do período ·{" "}
              <span className="text-slate-400 font-normal">
                {new Date(`${periodoFiltro}-02`).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
              </span>
            </h2>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <Loader2 size={28} className="animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
              <Wallet size={32} />
              <p className="text-sm">Nenhum item de orçamento neste período.</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-2 px-4 py-2 bg-unifique-primary text-white rounded-lg text-xs font-bold"
              >
                Adicionar primeiro item
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {items.map((item) => {
                const stCfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.Planejado;
                const StIcon = stCfg.icon;
                const pct = item.orcamento > 0 ? Math.round((item.gasto / item.orcamento) * 100) : 0;
                return (
                  <div key={item.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                    <div className={cn("flex-shrink-0 px-2 py-1 rounded text-[10px] font-bold", CAT_COLORS[item.categoria] ?? "bg-slate-100 text-slate-600")}>
                      {item.categoria}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{item.descricao}</p>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-white/10 rounded-full mt-1.5 max-w-[200px]">
                        <div
                          className={cn("h-full rounded-full", pct > 100 ? "bg-red-500" : "bg-unifique-success")}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs flex-shrink-0">
                      <StIcon size={13} className={stCfg.color} />
                      <span className={cn("font-bold", stCfg.color)}>{item.status}</span>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{formatCurrency(item.gasto)}</p>
                      <p className="text-[10px] text-slate-400">de {formatCurrency(item.orcamento)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
