"use client";

import { useState, useEffect } from "react";
import { Shell } from "@/components/layout/Shell";
import { supabase } from "@/lib/supabase";
import { formatCurrency, cn } from "@/lib/utils";
import type { Negocio } from "@/types";
import {
  Target,
  TrendingUp,
  Users,
  Clock,
  BarChart3,
  Award,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from "lucide-react";

interface TicketStats {
  ticketMedio: number;
  cpl: number;
  cac: number;
  roi: number;
  totalInvestimento: number;
  totalLeads: number;
  totalFechamentos: number;
  porSegmento: { label: string; valor: number; pct: number }[];
  estrategiaPorConta: { empresa: string; tm: number; recomendacao: string; cpl: number }[];
}

function calcROI(faturamento: number, investimento: number): number {
  if (investimento <= 0) return 0;
  return Math.round(((faturamento - investimento) / investimento) * 100);
}

function gerarRecomendacao(tm: number, cplPct: number): string {
  if (tm > 150000) return "Conta estratégica — alocar Consultor Senior + eventos presenciais";
  if (tm > 50000) return "Conta importante — visitas mensais + proposta personalizada";
  if (cplPct > 15) return "⚠ CPL elevado — revisar canal de prospecção";
  return "Manter engajamento regular";
}

export default function TicketPage() {
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("negocios")
        .select("*, empresas(nome, segmento)")
        .order("valor", { ascending: false });

      const negocios: Negocio[] = (data ?? []) as Negocio[];
      const fechados = negocios.filter((n) => n.fase === "Fechamento" || n.fase === "Contrato");

      const totalValorFechado = fechados.reduce((s, n) => s + (n.valor || 0), 0);
      const totalInvestimento = negocios.reduce((s, n) => s + (n.investimento || 0), 0);
      const totalLeads = negocios.reduce((s, n) => s + (n.leads || 0), 0);

      const ticketMedio = fechados.length > 0 ? totalValorFechado / fechados.length : 0;
      const cpl = totalLeads > 0 ? totalInvestimento / totalLeads : 0;
      const taxaConversao = negocios.length > 0 ? fechados.length / negocios.length : 0;
      const cac = taxaConversao > 0 ? cpl / taxaConversao : 0;
      const roi = calcROI(totalValorFechado, totalInvestimento);

      // Group by segmento
      const segMap: Record<string, number> = {};
      negocios.forEach((n) => {
        const seg = (n as any).empresas?.segmento || "Outros";
        segMap[seg] = (segMap[seg] || 0) + (n.valor || 0);
      });
      const totalGeral = Object.values(segMap).reduce((s, v) => s + v, 0);
      const maxSeg = Math.max(...Object.values(segMap), 1);
      const porSegmento = Object.entries(segMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([label, valor]) => ({
          label,
          valor,
          pct: Math.round((valor / maxSeg) * 100),
        }));

      // Estratégia por conta (top negocios fechados)
      const estrategiaPorConta = fechados.slice(0, 5).map((n) => {
        const cplNeg = n.leads > 0 ? (n.investimento || 0) / n.leads : 0;
        const cplPct = n.valor > 0 ? (cplNeg / n.valor) * 100 : 0;
        return {
          empresa: (n as any).empresas?.nome || "—",
          tm: n.valor,
          recomendacao: gerarRecomendacao(n.valor, cplPct),
          cpl: cplNeg,
        };
      });

      setStats({
        ticketMedio,
        cpl,
        cac,
        roi,
        totalInvestimento,
        totalLeads,
        totalFechamentos: fechados.length,
        porSegmento,
        estrategiaPorConta,
      });
      setLoading(false);
    }
    load();
  }, []);

  const kpis = stats
    ? [
        { label: "Ticket Médio", value: formatCurrency(stats.ticketMedio), icon: Target, color: "text-unifique-primary", bg: "bg-unifique-primary/10", sub: `${stats.totalFechamentos} fechamentos` },
        { label: "CPL", value: formatCurrency(stats.cpl), icon: Users, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20", sub: `${stats.totalLeads} leads` },
        { label: "CAC", value: formatCurrency(stats.cac), icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20", sub: "Custo de aquisição" },
        { label: "ROI", value: `${stats.roi}%`, icon: Award, color: stats.roi >= 0 ? "text-emerald-600" : "text-red-500", bg: stats.roi >= 0 ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-red-50 dark:bg-red-900/20", sub: "Retorno s/ investimento" },
      ]
    : [];

  const SEG_COLORS = [
    "bg-unifique-primary",
    "bg-cyan-400",
    "bg-indigo-500",
    "bg-emerald-400",
    "bg-amber-400",
  ];

  return (
    <Shell>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-outfit">
            Ticket Médio & Estratégia
          </h1>
          <p className="text-slate-500 mt-1">
            Métricas comerciais calculadas em tempo real a partir do pipeline.
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="glass-card p-6 animate-pulse">
                  <div className="w-10 h-10 bg-slate-200 dark:bg-white/10 rounded-xl mb-4" />
                  <div className="h-3 bg-slate-200 dark:bg-white/10 rounded w-2/3 mb-2" />
                  <div className="h-7 bg-slate-200 dark:bg-white/10 rounded w-1/2" />
                </div>
              ))
            : kpis.map((k) => (
                <div key={k.label} className="glass-card p-6 hover:translate-y-[-4px] transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className={cn("p-2.5 rounded-xl", k.bg)}>
                      <k.icon size={20} className={k.color} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">{k.sub}</span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{k.label}</p>
                  <h3 className={cn("text-2xl font-bold mt-1 font-outfit", k.color)}>{k.value}</h3>
                </div>
              ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Segmento distribution */}
          <div className="lg:col-span-2 glass-card p-6">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
              <BarChart3 size={20} className="text-unifique-primary" />
              Distribuição de Pipeline por Segmento
            </h2>
            {loading ? (
              <div className="flex items-center justify-center py-12 text-slate-400">
                <Loader2 size={24} className="animate-spin" />
              </div>
            ) : stats?.porSegmento.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">Sem dados de segmento disponíveis.</p>
            ) : (
              <div className="space-y-5">
                {stats?.porSegmento.map((item, i) => (
                  <div key={item.label}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{item.label}</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{formatCurrency(item.valor)}</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-1000", SEG_COLORS[i % SEG_COLORS.length])}
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Strategic insight */}
          <div className="glass-card p-6 bg-gradient-to-br from-unifique-primary to-blue-700 text-white border-none">
            <h3 className="font-bold text-lg mb-4">Análise Estratégica</h3>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={20} className="animate-spin text-white/50" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-white/10 rounded-xl border border-white/10">
                  <p className="text-[10px] font-bold text-white/60 uppercase mb-1">Ticket Médio</p>
                  <p className="text-xs">
                    {(stats?.ticketMedio ?? 0) > 150000
                      ? "Pipeline de alto valor — priorizar contas estratégicas."
                      : (stats?.ticketMedio ?? 0) > 50000
                      ? "Ticket saudável — manter cadência de follow-ups."
                      : "Ticket abaixo de R$ 50K — buscar oportunidades maiores."}
                  </p>
                </div>
                <div className="p-3 bg-white/10 rounded-xl border border-white/10">
                  <p className="text-[10px] font-bold text-white/60 uppercase mb-1">CPL / ROI</p>
                  <p className="text-xs">
                    {(stats?.roi ?? 0) >= 200
                      ? `ROI de ${stats?.roi}% — excelente retorno sobre prospecção.`
                      : (stats?.roi ?? 0) >= 0
                      ? `ROI de ${stats?.roi}% — revisar canais de menor conversão.`
                      : "ROI negativo — investimento supera receita. Revisão urgente."}
                  </p>
                </div>
                <div className="p-3 bg-white/10 rounded-xl border border-white/10">
                  <p className="text-[10px] font-bold text-white/60 uppercase mb-1">CAC</p>
                  <p className="text-xs">
                    {(stats?.ticketMedio ?? 0) > 0 && (stats?.cac ?? 0) > 0
                      ? `LTV/CAC estimado: ${(((stats?.ticketMedio ?? 0) * 4) / (stats?.cac ?? 1)).toFixed(1)}x ${((stats?.ticketMedio ?? 0) * 4) / (stats?.cac ?? 1) >= 4 ? "✓ excelente" : "— abaixo do ideal (4x)"}`
                      : "Sem dados suficientes para LTV/CAC."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Strategy per account */}
        {!loading && (stats?.estrategiaPorConta?.length ?? 0) > 0 && (
          <div className="glass-card overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5">
              <h2 className="font-bold text-sm">Estratégia Automática por Conta</h2>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {stats?.estrategiaPorConta.map((c, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4">
                  <div className="w-9 h-9 rounded-xl bg-unifique-primary/10 flex items-center justify-center text-xs font-bold text-unifique-primary flex-shrink-0">
                    {c.empresa.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{c.empresa}</p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{c.recomendacao}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold text-unifique-primary">{formatCurrency(c.tm)}</p>
                    {c.cpl > 0 && <p className="text-[10px] text-slate-400">CPL: {formatCurrency(c.cpl)}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
