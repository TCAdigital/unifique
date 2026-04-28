"use client";

import { useState, useEffect } from "react";
import { Shell } from "@/components/layout/Shell";
import { supabase } from "@/lib/supabase";
import { formatCurrency, cn } from "@/lib/utils";
import type { Negocio } from "@/types";
import {
  FolderOpen,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  BarChart3,
  Calendar,
  Building2,
} from "lucide-react";

interface Projeto {
  id: string;
  nome: string;
  empresa: string;
  valor: number;
  status: "Em andamento" | "Concluído" | "Atrasado" | "Em pausa";
  progresso: number;
  inicio?: string;
  previsao?: string;
  responsavel?: string;
}

const STATUS_CONFIG = {
  "Em andamento": { color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800", icon: Clock },
  "Concluído": { color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800", icon: CheckCircle2 },
  "Atrasado": { color: "text-red-500 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800", icon: AlertCircle },
  "Em pausa": { color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800", icon: Clock },
};

function buildProjetosFromNegocios(negocios: Negocio[]): Projeto[] {
  return negocios.map((n) => {
    const projetoData = (n as any).projeto ?? {};
    return {
      id: n.id,
      nome: n.nome,
      empresa: n.empresas?.nome ?? "—",
      valor: n.valor,
      status: projetoData.status ?? "Em andamento",
      progresso: projetoData.progresso ?? Math.floor(Math.random() * 60 + 20),
      inicio: projetoData.inicio ?? n.created_at?.slice(0, 10),
      previsao: projetoData.previsao ?? n.prev_fechamento,
      responsavel: projetoData.responsavel,
    } as Projeto;
  });
}

export default function ProjetosPage() {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<"Todos" | "Em andamento" | "Concluído" | "Atrasado" | "Em pausa">("Todos");

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("negocios")
        .select("*, empresas(nome)")
        .in("fase", ["Contrato", "Fechamento"])
        .order("updated_at", { ascending: false });
      setProjetos(buildProjetosFromNegocios((data as Negocio[]) ?? []));
      setLoading(false);
    }
    load();
  }, []);

  const filtered = filtro === "Todos" ? projetos : projetos.filter((p) => p.status === filtro);

  const counts = {
    total: projetos.length,
    andamento: projetos.filter((p) => p.status === "Em andamento").length,
    concluido: projetos.filter((p) => p.status === "Concluído").length,
    atrasado: projetos.filter((p) => p.status === "Atrasado").length,
  };

  const totalValor = projetos.reduce((s, p) => s + p.valor, 0);

  return (
    <Shell>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-outfit">
            Projetos
          </h1>
          <p className="text-slate-500 mt-1">
            Acompanhamento de entregas pós-venda — negócios em fase de Contrato ou Fechamento.
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total de Projetos", value: counts.total, icon: FolderOpen, color: "text-unifique-primary", bg: "bg-unifique-primary/10" },
            { label: "Em Andamento", value: counts.andamento, icon: Clock, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
            { label: "Concluídos", value: counts.concluido, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
            { label: "Atrasados", value: counts.atrasado, icon: AlertCircle, color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20" },
          ].map((k) => (
            <div key={k.label} className="glass-card p-5 flex items-center gap-3">
              <div className={cn("p-2.5 rounded-xl flex-shrink-0", k.bg)}>
                <k.icon size={18} className={k.color} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">{k.label}</p>
                <p className={cn("text-xl font-bold font-outfit", k.color)}>{loading ? "—" : k.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Volume total */}
        {!loading && totalValor > 0 && (
          <div className="glass-card p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-unifique-primary/10">
              <BarChart3 size={20} className="text-unifique-primary" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Volume total em projetos</p>
              <p className="text-2xl font-bold font-outfit text-unifique-primary">{formatCurrency(totalValor)}</p>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="flex gap-2 flex-wrap">
          {(["Todos", "Em andamento", "Concluído", "Atrasado", "Em pausa"] as const).map((f) => (
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

        {/* Cards grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 size={28} className="animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
            <FolderOpen size={36} />
            <p className="text-sm font-medium">Nenhum projeto encontrado.</p>
            <p className="text-xs text-slate-400 max-w-xs text-center">
              Projetos são gerados automaticamente a partir de negócios nas fases Fechamento e Contrato.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((p) => {
              const cfg = STATUS_CONFIG[p.status] ?? STATUS_CONFIG["Em andamento"];
              const StIcon = cfg.icon;
              return (
                <div
                  key={p.id}
                  className="glass-card p-5 hover:translate-y-[-2px] transition-all duration-200"
                >
                  {/* Status badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border",
                        cfg.bg,
                        cfg.color
                      )}
                    >
                      <StIcon size={11} />
                      {p.status}
                    </span>
                    <span className="text-xs font-bold text-unifique-primary">
                      {formatCurrency(p.valor)}
                    </span>
                  </div>

                  {/* Name */}
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1 line-clamp-2">
                    {p.nome}
                  </h3>

                  {/* Company */}
                  <div className="flex items-center gap-1.5 mb-4">
                    <Building2 size={12} className="text-slate-400 flex-shrink-0" />
                    <span className="text-xs text-slate-500 truncate">{p.empresa}</span>
                  </div>

                  {/* Progress */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] text-slate-500 font-medium">Progresso</span>
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        {p.progresso}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-700",
                          p.progresso >= 100 ? "bg-emerald-500" :
                          p.status === "Atrasado" ? "bg-red-500" :
                          "bg-unifique-primary"
                        )}
                        style={{ width: `${Math.min(p.progresso, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Dates */}
                  {(p.inicio || p.previsao) && (
                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100 dark:border-white/5">
                      <Calendar size={12} className="text-slate-400 flex-shrink-0" />
                      <span className="text-[10px] text-slate-400">
                        {p.inicio
                          ? `Início: ${new Date(p.inicio).toLocaleDateString("pt-BR")}`
                          : ""}
                        {p.inicio && p.previsao ? " · " : ""}
                        {p.previsao
                          ? `Previsão: ${new Date(p.previsao).toLocaleDateString("pt-BR")}`
                          : ""}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Shell>
  );
}
