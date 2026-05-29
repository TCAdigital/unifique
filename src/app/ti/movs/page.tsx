"use client";

import { useState, useEffect } from "react";
import { Shell } from "@/components/layout/Shell";
import { cn, formatCurrency } from "@/lib/utils";
import { ArrowLeftRight, ArrowDownLeft, ArrowUpRight, Plus, X, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

type TipoMov = "Entrada" | "Saída" | "Transferência";

interface Movimentacao {
  id: string;
  data: string;
  tipo: TipoMov;
  item: string;
  categoria: string;
  quantidade: number;
  valor: number;
  responsavel: string;
  observacao?: string;
}

const TIPO_CONFIG: Record<TipoMov, { color: string; bg: string; icon: React.ElementType }> = {
  Entrada: { color: "text-emerald-600", bg: "bg-emerald-50", icon: ArrowDownLeft },
  Saída: { color: "text-red-500", bg: "bg-red-50", icon: ArrowUpRight },
  Transferência: { color: "text-blue-600", bg: "bg-blue-50", icon: ArrowLeftRight },
};

const CATEGORIAS = ["Hardware", "Software", "Rede", "Infraestrutura", "Segurança", "Cabeamento", "Outro"];

const BLANK_FORM = {
  tipo: "Entrada" as TipoMov,
  item: "",
  categoria: "Hardware",
  quantidade: "1",
  valor: "",
  responsavel: "",
  observacao: "",
  data: new Date().toISOString().split("T")[0],
};

export default function MovimentacoesPage() {
  const [movs, setMovs] = useState<Movimentacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<"Todas" | TipoMov>("Todas");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const [erro, setErro] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadData() {
    const { data } = await supabase
      .from("ti_movimentacoes")
      .select("id, data_mov, tipo, item_nome, categoria, qtd, custo, usuario, obs")
      .order("data_mov", { ascending: false });
    setMovs((data ?? []).map(d => ({
      id: d.id,
      data: d.data_mov,
      tipo: d.tipo as TipoMov,
      item: d.item_nome ?? "",
      categoria: d.categoria ?? "",
      quantidade: d.qtd ?? 0,
      valor: Number(d.custo) || 0,
      responsavel: d.usuario ?? "",
      observacao: d.obs ?? undefined,
    })));
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  const filtered = filtro === "Todas" ? movs : movs.filter((m) => m.tipo === filtro);
  const entradas = movs.filter((m) => m.tipo === "Entrada").reduce((s, m) => s + m.valor * m.quantidade, 0);
  const saidas = movs.filter((m) => m.tipo === "Saída").reduce((s, m) => s + m.valor * m.quantidade, 0);

  function openModal() {
    setForm({ ...BLANK_FORM, data: new Date().toISOString().split("T")[0] });
    setErro("");
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.item.trim()) { setErro("Descrição do item é obrigatória."); return; }
    if (!form.responsavel.trim()) { setErro("Responsável é obrigatório."); return; }
    setSaving(true);
    const { error } = await supabase.from("ti_movimentacoes").insert({
      id: String(Date.now()),
      data_mov: form.data,
      tipo: form.tipo,
      item_nome: form.item.trim(),
      categoria: form.categoria,
      qtd: parseInt(form.quantidade) || 1,
      custo: parseFloat(form.valor) || 0,
      usuario: form.responsavel.trim(),
      obs: form.observacao.trim() || null,
    });
    setSaving(false);
    if (error) { setErro("Erro ao salvar: " + error.message); return; }
    setShowModal(false);
    loadData();
  }

  return (
    <Shell>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-outfit">Movimentações TI</h1>
            <p className="text-slate-500 mt-1">Entradas, saídas e transferências de itens de estoque.</p>
          </div>
          <button
            onClick={openModal}
            className="flex items-center gap-2 px-4 py-2 bg-unifique-primary text-white rounded-xl text-sm font-bold hover:scale-[1.02] transition-all shadow-lg shadow-unifique-primary/25"
          >
            <Plus size={16} /> Nova Movimentação
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Total Entradas", value: entradas, icon: ArrowDownLeft, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Total Saídas", value: saidas, icon: ArrowUpRight, color: "text-red-500", bg: "bg-red-50" },
            { label: "Saldo do Período", value: entradas - saidas, icon: ArrowLeftRight, color: entradas - saidas >= 0 ? "text-emerald-600" : "text-red-500", bg: "bg-slate-50" },
          ].map((k) => (
            <div key={k.label} className="glass-card p-5 flex items-center gap-4">
              <div className={cn("p-3 rounded-xl flex-shrink-0", k.bg)}>
                <k.icon size={20} className={k.color} />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">{k.label}</p>
                <p className={cn("text-xl font-bold font-outfit", k.color)}>{formatCurrency(k.value)}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          {(["Todas", "Entrada", "Saída", "Transferência"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                filtro === f ? "bg-unifique-primary text-white shadow-md" : "bg-white border border-slate-200 hover:border-unifique-primary/40"
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="glass-card overflow-hidden">
          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="p-12 text-center text-slate-400">
                <Loader2 className="animate-spin mx-auto mb-2" size={20} />
                <p>Carregando...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <p>Nenhuma movimentação encontrada.</p>
              </div>
            ) : filtered.map((m) => {
              const cfg = TIPO_CONFIG[m.tipo];
              const TipoIcon = cfg.icon;
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-all"
                >
                  <div className={cn("p-2.5 rounded-xl flex-shrink-0", cfg.bg)}>
                    <TipoIcon size={16} className={cfg.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate text-slate-900">{m.item}</p>
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded font-medium text-slate-600">{m.categoria}</span>
                      {m.observacao && <span className="text-[11px] text-slate-400 truncate">{m.observacao}</span>}
                    </div>
                  </div>
                  <div className="text-center flex-shrink-0">
                    <p className="text-xs font-bold text-slate-700">{m.quantidade} un.</p>
                    <p className="text-[10px] text-slate-400">{m.responsavel}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={cn("font-bold text-sm", cfg.color)}>
                      {m.tipo === "Saída" ? "−" : "+"}{formatCurrency(m.valor * m.quantidade)}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {new Date(m.data + "T12:00:00").toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,24,64,0.45)", backdropFilter: "blur(4px)" }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Nova Movimentação</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-all">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {(["Entrada", "Saída", "Transferência"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setForm(f => ({ ...f, tipo: t }))}
                    className={cn(
                      "py-2 rounded-lg text-xs font-bold transition-all border",
                      form.tipo === t
                        ? t === "Entrada" ? "bg-emerald-500 text-white border-emerald-500"
                          : t === "Saída" ? "bg-red-500 text-white border-red-500"
                          : "bg-blue-500 text-white border-blue-500"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <label className="block">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Item / Descrição *</span>
                <input
                  type="text"
                  value={form.item}
                  onChange={e => setForm(f => ({ ...f, item: e.target.value }))}
                  placeholder="Ex: Notebook Dell Latitude 5430"
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all"
                  autoFocus
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Categoria</span>
                  <select
                    value={form.categoria}
                    onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all bg-white"
                  >
                    {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Data</span>
                  <input
                    type="date"
                    value={form.data}
                    onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quantidade</span>
                  <input
                    type="number"
                    min="1"
                    value={form.quantidade}
                    onChange={e => setForm(f => ({ ...f, quantidade: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Valor Unitário (R$)</span>
                  <input
                    type="number"
                    value={form.valor}
                    onChange={e => setForm(f => ({ ...f, valor: e.target.value }))}
                    placeholder="0,00"
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Responsável *</span>
                <input
                  type="text"
                  value={form.responsavel}
                  onChange={e => setForm(f => ({ ...f, responsavel: e.target.value }))}
                  placeholder="Nome do responsável"
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all"
                />
              </label>

              <label className="block">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Observação</span>
                <input
                  type="text"
                  value={form.observacao}
                  onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))}
                  placeholder="NF, projeto, destino..."
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all"
                />
              </label>

              {erro && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">{erro}</div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-100">
              <button onClick={() => { setShowModal(false); setErro(""); }} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-unifique-primary text-white text-sm font-bold rounded-lg hover:bg-unifique-primary/90 disabled:opacity-60 transition-all"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {saving ? "Registrando..." : "Registrar Movimentação"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </Shell>
  );
}
