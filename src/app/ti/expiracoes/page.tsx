"use client";

import { useState, useEffect, useMemo } from "react";
import { Shell } from "@/components/layout/Shell";
import { supabase } from "@/lib/supabase";
import { formatCurrency, cn } from "@/lib/utils";
import { Clock, AlertTriangle, CheckCircle, XCircle, Package, Search, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface ItemGarantia {
  id: string;
  nome: string;
  tipo: string;
  fornecedor?: string;
  sku?: string;
  vigencia_garantia: string;
  custo_unit: number;
  qtd_estoque: number;
  sc_po?: string;
  negocio_nome?: string;
}

function diasRestantes(dataStr: string): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const venc = new Date(dataStr);
  return Math.ceil((venc.getTime() - hoje.getTime()) / 86400000);
}

function statusGarantia(dias: number): { label: string; color: string; bg: string; border: string; icon: React.ElementType } {
  if (dias < 0)   return { label: "Expirado",    color: "text-red-700",    bg: "bg-red-50",    border: "border-l-red-500",    icon: XCircle         };
  if (dias <= 30)  return { label: "Crítico",     color: "text-red-600",    bg: "bg-red-50",    border: "border-l-red-400",    icon: AlertTriangle   };
  if (dias <= 90)  return { label: "Atenção",     color: "text-amber-700",  bg: "bg-amber-50",  border: "border-l-amber-400",  icon: Clock           };
  if (dias <= 180) return { label: "Próximo",     color: "text-blue-700",   bg: "bg-blue-50",   border: "border-l-blue-400",   icon: Clock           };
  return             { label: "OK",           color: "text-emerald-700", bg: "bg-emerald-50",border: "border-l-emerald-400", icon: CheckCircle     };
}

export default function ContratoExpiracaoPage() {
  const [itens, setItens] = useState<ItemGarantia[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState<"todos" | "expirado" | "critico" | "atencao">("todos");

  useEffect(() => {
    supabase
      .from("ti_itens")
      .select("id, nome, tipo, fornecedor, sku, vigencia_garantia, custo_unit, qtd_estoque, sc_po, negocio_nome")
      .not("vigencia_garantia", "is", null)
      .order("vigencia_garantia", { ascending: true })
      .then(({ data }) => {
        setItens((data ?? []) as ItemGarantia[]);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    let list = itens;

    if (filtro !== "todos") {
      list = list.filter(i => {
        const d = diasRestantes(i.vigencia_garantia);
        if (filtro === "expirado") return d < 0;
        if (filtro === "critico")  return d >= 0 && d <= 30;
        if (filtro === "atencao")  return d > 30 && d <= 90;
        return true;
      });
    }

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(i =>
        i.nome.toLowerCase().includes(q) ||
        (i.fornecedor ?? "").toLowerCase().includes(q) ||
        (i.sku ?? "").toLowerCase().includes(q) ||
        (i.sc_po ?? "").toLowerCase().includes(q)
      );
    }

    return list;
  }, [itens, filtro, search]);

  const expirados  = itens.filter(i => diasRestantes(i.vigencia_garantia) < 0).length;
  const criticos   = itens.filter(i => { const d = diasRestantes(i.vigencia_garantia); return d >= 0 && d <= 30; }).length;
  const atencao    = itens.filter(i => { const d = diasRestantes(i.vigencia_garantia); return d > 30 && d <= 90; }).length;

  const FILTROS = [
    { id: "todos",    label: `Todos (${itens.length})` },
    { id: "expirado", label: `Expirados (${expirados})` },
    { id: "critico",  label: `Críticos ≤30d (${criticos})` },
    { id: "atencao",  label: `Atenção ≤90d (${atencao})` },
  ] as const;

  return (
    <Shell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-outfit text-slate-900">Contratos em Expiração</h1>
          <p className="text-sm text-slate-500">Vigências de suporte e garantia dos itens do Estoque TIC.</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Total com Garantia",   value: itens.length,  icon: Package,       color: "text-slate-600",      bg: "bg-slate-100"      },
            { label: "Expirados",            value: expirados,     icon: XCircle,       color: "text-red-600",        bg: "bg-red-50"         },
            { label: "Críticos (≤ 30 dias)", value: criticos,      icon: AlertTriangle, color: "text-red-500",        bg: "bg-red-50"         },
            { label: "Atenção (≤ 90 dias)",  value: atencao,       icon: Clock,         color: "text-amber-600",      bg: "bg-amber-50"       },
          ].map(k => (
            <div key={k.label} className="glass-card p-4 flex items-center gap-3">
              <div className={cn("p-2.5 rounded-xl flex-shrink-0", k.bg)}>
                <k.icon size={18} className={k.color} />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">{k.label}</p>
                <p className={cn("text-xl font-bold", k.color)}>{k.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filtros + busca */}
        <div className="glass-card p-4 flex flex-col md:flex-row gap-3 items-start md:items-center">
          <div className="flex rounded-lg border border-slate-200 overflow-hidden flex-shrink-0 flex-wrap">
            {FILTROS.map(f => (
              <button
                key={f.id}
                onClick={() => setFiltro(f.id)}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap",
                  filtro === f.id ? "bg-unifique-primary text-white" : "text-slate-600 hover:bg-slate-50"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Buscar por nome, SKU, fornecedor..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary/50 transition-all"
            />
          </div>
        </div>

        {/* Lista */}
        <div className="space-y-2">
          {loading ? (
            <div className="glass-card p-12 text-center text-slate-400">
              <Loader2 className="animate-spin mx-auto mb-2" size={24} />
              Carregando...
            </div>
          ) : filtered.length === 0 ? (
            <div className="glass-card p-12 text-center text-slate-400">
              <CheckCircle className="mx-auto mb-3 text-emerald-400 opacity-60" size={36} />
              <p className="font-medium">Nenhum item encontrado.</p>
            </div>
          ) : filtered.map((item, idx) => {
            const dias = diasRestantes(item.vigencia_garantia);
            const st   = statusGarantia(dias);
            const Icon = st.icon;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className={cn("glass-card p-4 border-l-4 flex items-center gap-4", st.border)}
              >
                <div className={cn("p-2 rounded-lg flex-shrink-0", st.bg)}>
                  <Icon size={18} className={st.color} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-sm text-slate-900">{item.nome}</p>
                    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 uppercase">
                      {item.tipo}
                    </span>
                    <span className={cn("inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold", st.bg, st.color)}>
                      {st.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-slate-400">
                    {item.sku      && <span className="font-mono">{item.sku}</span>}
                    {item.fornecedor && <span>{item.fornecedor}</span>}
                    {item.sc_po    && <span>SC/PO: {item.sc_po}</span>}
                    {item.negocio_nome && <span className="text-unifique-primary">↗ {item.negocio_nome}</span>}
                  </div>
                </div>

                <div className="text-right flex-shrink-0 space-y-0.5">
                  <p className="text-sm font-bold text-slate-700">
                    {new Date(item.vigencia_garantia + "T12:00:00").toLocaleDateString("pt-BR")}
                  </p>
                  <p className={cn("text-xs font-bold", st.color)}>
                    {dias < 0
                      ? `${Math.abs(dias)} dias expirado`
                      : dias === 0
                      ? "Expira hoje"
                      : `${dias} dias restantes`}
                  </p>
                  <p className="text-[10px] text-slate-400">{formatCurrency(item.custo_unit)} · {item.qtd_estoque} un.</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Shell>
  );
}
