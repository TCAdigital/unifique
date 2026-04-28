"use client";

import { useState, useEffect } from "react";
import { Shell } from "@/components/layout/Shell";
import { supabase } from "@/lib/supabase";
import { formatCurrency, cn } from "@/lib/utils";
import type { Negocio } from "@/types";
import { Star, TrendingUp, Zap, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

const FASE_SCORE: Record<string, number> = {
  Prospecção: 10,
  Qualificação: 25,
  Proposta: 45,
  Negociação: 65,
  Fechamento: 85,
  Contrato: 100,
};

const SINAIS_LABELS: Record<string, string> = {
  budget_confirmado: "Budget confirmado",
  decisor_envolvido: "Decisor envolvido",
  prazo_definido: "Prazo definido",
  dor_mapeada: "Dor mapeada",
  concorrencia_avaliada: "Concorrência avaliada",
  proposta_enviada: "Proposta enviada",
  demo_realizada: "Demo realizada",
  contrato_em_analise: "Contrato em análise",
};

interface ScoredNegocio extends Negocio {
  score: number;
  nivel: "Quente" | "Morno" | "Frio";
}

function calcScore(n: Negocio): number {
  const faseBase = FASE_SCORE[n.fase] ?? 10;
  const probWeight = n.probabilidade * 0.4;
  const sinaisCount = n.sinais ? Object.values(n.sinais).filter(Boolean).length : 0;
  const sinaisBonus = sinaisCount * 5;
  const leadsBonus = n.leads > 0 ? Math.min(n.leads * 2, 10) : 0;
  return Math.min(Math.round(faseBase * 0.4 + probWeight * 0.4 + sinaisBonus + leadsBonus), 100);
}

function getNivel(score: number): "Quente" | "Morno" | "Frio" {
  if (score >= 65) return "Quente";
  if (score >= 35) return "Morno";
  return "Frio";
}

function ScoreGauge({ score }: { score: number }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 65 ? "#1D9E75" : score >= 35 ? "#D97706" : "#DC2626";

  return (
    <svg width={52} height={52} viewBox="0 0 52 52">
      <circle cx={26} cy={26} r={r} fill="none" stroke="#e2e8f0" strokeWidth={5} />
      <circle
        cx={26}
        cy={26}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={5}
        strokeDasharray={`${fill} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 26 26)"
        style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
      <text x={26} y={30} textAnchor="middle" fontSize={11} fontWeight="700" fill={color}>
        {score}
      </text>
    </svg>
  );
}

const NIVEL_CONFIG = {
  Quente: { color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800", icon: Zap },
  Morno: { color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800", icon: TrendingUp },
  Frio: { color: "text-slate-500 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700", icon: AlertTriangle },
};

export default function ScoringPage() {
  const [negocios, setNegocios] = useState<ScoredNegocio[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"Todos" | "Quente" | "Morno" | "Frio">("Todos");

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("negocios")
        .select("*, empresas(nome)")
        .not("fase", "eq", "Contrato")
        .order("probabilidade", { ascending: false });

      const scored: ScoredNegocio[] = (data ?? []).map((n) => {
        const score = calcScore(n as Negocio);
        return { ...(n as Negocio), score, nivel: getNivel(score) };
      });
      scored.sort((a, b) => b.score - a.score);
      setNegocios(scored);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = filter === "Todos" ? negocios : negocios.filter((n) => n.nivel === filter);
  const quentes = negocios.filter((n) => n.nivel === "Quente").length;
  const mornos = negocios.filter((n) => n.nivel === "Morno").length;
  const frios = negocios.filter((n) => n.nivel === "Frio").length;

  return (
    <Shell>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-outfit">
            Lead Scoring
          </h1>
          <p className="text-slate-500 mt-1">
            Ranqueamento automático de oportunidades por sinais de intenção de compra.
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Leads Quentes", count: quentes, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20", icon: Zap },
            { label: "Leads Mornos", count: mornos, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20", icon: TrendingUp },
            { label: "Leads Frios", count: frios, color: "text-slate-500", bg: "bg-slate-50 dark:bg-slate-800", icon: AlertTriangle },
          ].map((k) => (
            <div key={k.label} className="glass-card p-5 flex items-center gap-4">
              <div className={cn("p-3 rounded-xl", k.bg)}>
                <k.icon size={22} className={k.color} />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">{k.label}</p>
                <p className={cn("text-2xl font-bold font-outfit", k.color)}>
                  {loading ? "—" : k.count}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {(["Todos", "Quente", "Morno", "Frio"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                filter === f
                  ? "bg-unifique-primary text-white shadow-md"
                  : "bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-unifique-primary/40"
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="glass-card overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <Loader2 size={28} className="animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
              <Star size={32} />
              <p className="text-sm">Nenhum negócio encontrado.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {filtered.map((n, idx) => {
                const cfg = NIVEL_CONFIG[n.nivel];
                const NivelIcon = cfg.icon;
                const sinaisAtivos = n.sinais
                  ? Object.entries(n.sinais).filter(([, v]) => v)
                  : [];

                return (
                  <div
                    key={n.id}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
                  >
                    {/* Rank */}
                    <span className="text-xs font-bold text-slate-400 w-5 text-center">
                      #{idx + 1}
                    </span>

                    {/* Gauge */}
                    <ScoreGauge score={n.score} />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-sm truncate">{n.nome}</p>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border",
                            cfg.bg,
                            cfg.color
                          )}
                        >
                          <NivelIcon size={10} />
                          {n.nivel}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {n.empresas?.nome ?? "—"} · {n.fase}
                      </p>
                      {sinaisAtivos.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {sinaisAtivos.slice(0, 4).map(([key]) => (
                            <span
                              key={key}
                              className="text-[10px] px-1.5 py-0.5 bg-unifique-primary/10 text-unifique-primary rounded font-medium"
                            >
                              {SINAIS_LABELS[key] ?? key}
                            </span>
                          ))}
                          {sinaisAtivos.length > 4 && (
                            <span className="text-[10px] text-slate-400">
                              +{sinaisAtivos.length - 4}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Value + prob */}
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-sm text-unifique-primary">
                        {formatCurrency(n.valor)}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {n.probabilidade}% prob.
                      </p>
                      {n.leads > 0 && (
                        <p className="text-[10px] text-slate-400">{n.leads} leads</p>
                      )}
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
