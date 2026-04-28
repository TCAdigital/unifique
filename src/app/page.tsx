"use client";

import { useState, useEffect } from "react";
import { Shell } from "@/components/layout/Shell";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Negocio, Tarefa } from "@/types";
import {
  TrendingUp,
  Users,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  ArrowUpRight,
  Target,
  Building2,
  Phone,
  Mail,
  MessageSquare,
  CalendarDays,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

interface DashStats {
  totalEmpresas: number;
  totalNegocios: number;
  pipelineTotal: number;
  winRate: number;
  negociosRecentes: Negocio[];
  proximasTarefas: Tarefa[];
}

const FASE_COLORS: Record<string, string> = {
  Prospecção: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  Qualificação: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  Proposta: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  Negociação: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  Fechamento: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  Contrato: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
};

const TIPO_ICONS: Record<string, React.ElementType> = {
  Call: Phone,
  Reunião: CalendarDays,
  "E-mail": Mail,
  WhatsApp: MessageSquare,
  Proposta: Briefcase,
  Outro: CheckCircle2,
};

export default function Home() {
  const [stats, setStats] = useState<DashStats>({
    totalEmpresas: 0,
    totalNegocios: 0,
    pipelineTotal: 0,
    winRate: 0,
    negociosRecentes: [],
    proximasTarefas: [],
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    async function loadDashboard() {
      const today = new Date().toISOString().split("T")[0];

      const [empresasRes, negociosRes, tarefasRes] = await Promise.all([
        supabase.from("empresas").select("*", { count: "exact", head: true }),
        supabase
          .from("negocios")
          .select("*, empresas(nome)")
          .order("created_at", { ascending: false }),
        supabase
          .from("tarefas")
          .select("*")
          .eq("status", "Pendente")
          .gte("prazo", today)
          .order("prazo", { ascending: true })
          .limit(4),
      ]);

      const allNegocios: Negocio[] = negociosRes.data ?? [];
      const pipelineTotal = allNegocios.reduce((sum, n) => sum + (n.valor || 0), 0);
      const fechados = allNegocios.filter(
        (n) => n.fase === "Fechamento" || n.fase === "Contrato"
      ).length;
      const winRate =
        allNegocios.length > 0
          ? Math.round((fechados / allNegocios.length) * 100)
          : 0;

      setStats({
        totalEmpresas: empresasRes.count ?? 0,
        totalNegocios: allNegocios.length,
        pipelineTotal,
        winRate,
        negociosRecentes: allNegocios.slice(0, 5),
        proximasTarefas: (tarefasRes.data as Tarefa[]) ?? [],
      });
      setLoading(false);
    }

    loadDashboard();
  }, []);

  function formatPipeline(value: number) {
    if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(0)}K`;
    return formatCurrency(value);
  }

  return (
    <Shell>
      <div className="space-y-8">
        {/* Welcome */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-outfit">
              Olá, {user?.nome?.split(" ")[0] ?? "Tadeu"}
            </h1>
            <p className="text-slate-500 mt-1">
              Aqui está o que está acontecendo na Unifique hoje.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl shadow-sm text-sm font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-unifique-success animate-pulse" />
              Sistema Online
            </div>
            <a href="/ti/relatorios" className="px-4 py-2 bg-unifique-primary text-white rounded-xl shadow-lg shadow-unifique-primary/25 text-sm font-bold hover:scale-[1.02] active:scale-[0.98] transition-all">
              Ver Relatórios
            </a>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard
            title="Empresas Cadastradas"
            value={loading ? "—" : String(stats.totalEmpresas)}
            trend="Total"
            icon={Building2}
            color="blue"
            loading={loading}
          />
          <KpiCard
            title="Pipeline Total"
            value={loading ? "—" : formatPipeline(stats.pipelineTotal)}
            trend="Ativo"
            icon={Briefcase}
            color="cyan"
            loading={loading}
          />
          <KpiCard
            title="Win Rate"
            value={loading ? "—" : `${stats.winRate}%`}
            trend="Fechamentos"
            icon={TrendingUp}
            color="green"
            loading={loading}
          />
          <KpiCard
            title="Negócios no CRM"
            value={loading ? "—" : String(stats.totalNegocios)}
            trend="Total"
            icon={Target}
            color="purple"
            loading={loading}
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Deals */}
          <div className="lg:col-span-2 glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">Negócios Recentes</h2>
              <a
                href="/negocios"
                className="text-unifique-primary text-sm font-bold flex items-center gap-1 hover:underline"
              >
                Ver todos <ChevronRight size={14} />
              </a>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12 text-slate-400">
                <Loader2 size={24} className="animate-spin" />
              </div>
            ) : stats.negociosRecentes.length === 0 ? (
              <p className="text-center py-12 text-slate-400 text-sm">
                Nenhum negócio cadastrado ainda.
              </p>
            ) : (
              <div className="space-y-3">
                {stats.negociosRecentes.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all border border-transparent hover:border-slate-200 dark:hover:border-white/10"
                  >
                    <div className="w-10 h-10 rounded-xl bg-unifique-primary/10 flex items-center justify-center text-unifique-primary flex-shrink-0">
                      <Briefcase size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{item.nome}</p>
                      <p className="text-xs text-slate-500 truncate">
                        {item.empresas?.nome ?? "—"} ·{" "}
                        <span
                          className={cn(
                            "inline-block px-1.5 py-0.5 rounded text-[10px] font-bold",
                            FASE_COLORS[item.fase] ?? "bg-slate-100 text-slate-600"
                          )}
                        >
                          {item.fase}
                        </span>
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-sm text-unifique-primary">
                        {formatCurrency(item.valor)}
                      </p>
                      <p className="text-[10px] font-bold text-unifique-success">
                        {item.probabilidade}% prob.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar: Forecast + Tasks */}
          <div className="space-y-6">
            <div className="p-6 text-white rounded-[0.875rem] shadow-lg" style={{ background: 'linear-gradient(135deg, #0057B8 0%, #1d4ed8 100%)', border: 'none' }}>
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp size={20} />
              </div>
              <h3 className="font-bold text-lg mb-2">Previsão de Forecast</h3>
              <p className="text-white/70 text-sm mb-4">
                Analise cenários realistas, otimistas e pessimistas com base nos negócios ativos do pipeline.
              </p>
              <a
                href="/forecast"
                className="block w-full py-2 bg-white text-unifique-primary rounded-lg text-sm font-bold shadow-lg text-center hover:bg-white/90 transition-colors"
              >
                Ver Forecast IA
              </a>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm">Próximas Tarefas</h3>
                <a href="/atividades" className="text-unifique-primary text-xs font-bold hover:underline">
                  Ver todas
                </a>
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-6 text-slate-400">
                  <Loader2 size={20} className="animate-spin" />
                </div>
              ) : stats.proximasTarefas.length === 0 ? (
                <p className="text-center py-6 text-slate-400 text-xs">
                  Nenhuma tarefa pendente.
                </p>
              ) : (
                <div className="space-y-3">
                  {stats.proximasTarefas.map((t) => {
                    const TipoIcon = TIPO_ICONS[t.tipo] ?? CheckCircle2;
                    return (
                      <div
                        key={t.id}
                        className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10"
                      >
                        <TipoIcon size={15} className="text-unifique-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate">{t.titulo}</p>
                          <p className="text-[10px] text-slate-500">
                            {t.prazo ? new Date(t.prazo).toLocaleDateString("pt-BR") : "—"} · {t.tipo}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}

interface KpiCardProps {
  title: string;
  value: string;
  trend: string;
  icon: React.ElementType;
  color: "blue" | "green" | "cyan" | "purple";
  loading?: boolean;
}

function KpiCard({ title, value, trend, icon: Icon, color, loading }: KpiCardProps) {
  const colors = {
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    cyan: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
    purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  };

  return (
    <div className="glass-card p-6 hover:translate-y-[-4px] transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-2.5 rounded-xl", colors[color])}>
          <Icon size={20} />
        </div>
        <div className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 bg-slate-100 dark:bg-white/10 rounded-full">
          <ArrowUpRight size={10} className="text-unifique-success" />
          {trend}
        </div>
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{title}</p>
        {loading ? (
          <div className="mt-2 h-7 w-20 bg-slate-200 dark:bg-white/10 rounded animate-pulse" />
        ) : (
          <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white font-outfit">
            {value}
          </h3>
        )}
      </div>
    </div>
  );
}
