"use client";

import { useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeftRight, ArrowDownLeft, ArrowUpRight, Plus, Filter, Package } from "lucide-react";

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

const MOVS_MOCK: Movimentacao[] = [
  { id: "1", data: "2026-04-25", tipo: "Entrada", item: "Switch Cisco Catalyst 2960", categoria: "Rede", quantidade: 5, valor: 3200, responsavel: "João Silva", observacao: "NF 12345 — Fornecedor DataCenter SP" },
  { id: "2", data: "2026-04-24", tipo: "Saída", item: "Notebook Dell Latitude 5430", categoria: "Hardware", quantidade: 2, valor: 7800, responsavel: "Ana Paula", observacao: "Projeto Suzano — entrega cliente" },
  { id: "3", data: "2026-04-23", tipo: "Transferência", item: "Access Point UniFi U6", categoria: "Rede", quantidade: 8, valor: 1200, responsavel: "João Silva", observacao: "Transferência depósito SC → SP" },
  { id: "4", data: "2026-04-22", tipo: "Entrada", item: "Licença Microsoft 365 Business", categoria: "Software", quantidade: 20, valor: 450, responsavel: "Tadeu Alves" },
  { id: "5", data: "2026-04-21", tipo: "Saída", item: "Servidor HP ProLiant ML30", categoria: "Infraestrutura", quantidade: 1, valor: 14500, responsavel: "Carlos Lima", observacao: "Projeto GrupoMax" },
  { id: "6", data: "2026-04-20", tipo: "Entrada", item: "Firewall Fortinet 60F", categoria: "Segurança", quantidade: 3, valor: 8900, responsavel: "João Silva" },
  { id: "7", data: "2026-04-18", tipo: "Saída", item: "Cable UTP Cat6 (Cx 305m)", categoria: "Cabeamento", quantidade: 10, valor: 580, responsavel: "Ana Paula" },
];

const TIPO_CONFIG: Record<TipoMov, { color: string; bg: string; icon: React.ElementType }> = {
  Entrada: { color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20", icon: ArrowDownLeft },
  Saída: { color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20", icon: ArrowUpRight },
  Transferência: { color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20", icon: ArrowLeftRight },
};

export default function MovimentacoesPage() {
  const [filtro, setFiltro] = useState<"Todas" | TipoMov>("Todas");

  const movs = filtro === "Todas" ? MOVS_MOCK : MOVS_MOCK.filter((m) => m.tipo === filtro);

  const entradas = MOVS_MOCK.filter((m) => m.tipo === "Entrada").reduce((s, m) => s + m.valor * m.quantidade, 0);
  const saidas = MOVS_MOCK.filter((m) => m.tipo === "Saída").reduce((s, m) => s + m.valor * m.quantidade, 0);

  return (
    <Shell>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-outfit">
              Movimentações TI
            </h1>
            <p className="text-slate-500 mt-1">Entradas, saídas e transferências de itens de estoque.</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-unifique-primary text-white rounded-xl text-sm font-bold hover:scale-[1.02] transition-all shadow-lg shadow-unifique-primary/25">
            <Plus size={16} /> Nova Movimentação
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Total Entradas", value: entradas, icon: ArrowDownLeft, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
            { label: "Total Saídas", value: saidas, icon: ArrowUpRight, color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20" },
            { label: "Saldo do Período", value: entradas - saidas, icon: ArrowLeftRight, color: entradas - saidas >= 0 ? "text-emerald-600" : "text-red-500", bg: "bg-slate-50 dark:bg-slate-800" },
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
                filtro === f
                  ? "bg-unifique-primary text-white shadow-md"
                  : "bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-unifique-primary/40"
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="glass-card overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {movs.map((m) => {
              const cfg = TIPO_CONFIG[m.tipo];
              const TipoIcon = cfg.icon;
              return (
                <div key={m.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                  <div className={cn("p-2.5 rounded-xl flex-shrink-0", cfg.bg)}>
                    <TipoIcon size={16} className={cfg.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{m.item}</p>
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-white/10 rounded font-medium text-slate-600 dark:text-slate-300">{m.categoria}</span>
                      {m.observacao && <span className="text-[11px] text-slate-400 truncate">{m.observacao}</span>}
                    </div>
                  </div>
                  <div className="text-center flex-shrink-0">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{m.quantidade} un.</p>
                    <p className="text-[10px] text-slate-400">{m.responsavel}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={cn("font-bold text-sm", cfg.color)}>
                      {m.tipo === "Saída" ? "−" : "+"}{formatCurrency(m.valor * m.quantidade)}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {new Date(m.data).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Shell>
  );
}
