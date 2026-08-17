"use client";

import { useState, useEffect, useCallback } from "react";
import { Shell } from "@/components/layout/Shell";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import {
  CalendarCheck,
  Clock,
  AlertCircle,
  TrendingDown,
  Building2,
  Loader2,
  CheckCircle2,
  CheckCircle,
  AlertTriangle,
  Briefcase,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface TarefaItem {
  id: string;
  titulo: string;
  tipo: string;
  prazo: string;
  status: string;
  prioridade: string;
  empresa_nome?: string | null;
}

interface DiagItem {
  tipo: "D1" | "D2" | "D3";
  empresa?: string;
  negocio?: string;
  dias?: number;
  link: string;
  acao: string;
}

const PRIORIDADE_ORDER: Record<string, number> = { Crítica: 0, Alta: 1, Média: 2, Baixa: 3 };

export default function ChecklistPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tarefasHoje, setTarefasHoje] = useState<TarefaItem[]>([]);
  const [tarefasPendentes, setTarefasPendentes] = useState<TarefaItem[]>([]);
  const [diagnosticos, setDiagnosticos] = useState<DiagItem[]>([]);
  const [completing, setCompleting] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const today = new Date().toISOString().split("T")[0];
    const dt14 = new Date();
    dt14.setDate(dt14.getDate() - 14);
    const dt7 = new Date();
    dt7.setDate(dt7.getDate() - 7);

    const nomeEscapado = user.nome.replace(/"/g, '""');
    const userFilter = `responsavel_id.eq.${user.id},responsavel.eq."${nomeEscapado}"`;

    const [
      { data: hojeData },
      { data: pendentesData },
      { data: empresasData },
      { data: negociosData },
      { data: tarefasRecentesData },
      { data: notasRecentesData },
    ] = await Promise.all([
      supabase
        .from("tarefas")
        .select("id, titulo, tipo, prazo, status, prioridade, empresa_nome")
        .eq("prazo", today)
        .or(userFilter)
        .neq("status", "Concluída")
        .order("created_at"),

      supabase
        .from("tarefas")
        .select("id, titulo, tipo, prazo, status, prioridade, empresa_nome")
        .eq("status", "Pendente")
        .or(userFilter)
        .neq("prazo", today)
        .order("prazo")
        .limit(15),

      supabase.from("empresas").select("id, nome").order("nome"),

      supabase
        .from("negocios")
        .select("id, nome, empresa_id, fase, updated_at")
        .in("fase", ["Prospecção", "Qualificação", "Proposta", "Negociação", "Fechamento", "Contrato"]),

      supabase
        .from("tarefas")
        .select("empresa_id")
        .gte("created_at", dt14.toISOString())
        .not("empresa_id", "is", null),

      supabase
        .from("notas")
        .select("entidade_id")
        .eq("entidade_tipo", "empresas")
        .gte("created_at", dt14.toISOString()),
    ]);

    const hoje = (hojeData ?? []) as TarefaItem[];
    hoje.sort((a, b) => (PRIORIDADE_ORDER[a.prioridade] ?? 9) - (PRIORIDADE_ORDER[b.prioridade] ?? 9));
    setTarefasHoje(hoje);
    setTarefasPendentes((pendentesData ?? []) as TarefaItem[]);

    const diags: DiagItem[] = [];

    // D1 — contas sem atividade há +14 dias
    const comAtiv = new Set([
      ...(tarefasRecentesData ?? []).map((t: { empresa_id: string }) => t.empresa_id).filter(Boolean),
      ...(notasRecentesData ?? []).map((n: { entidade_id: string }) => n.entidade_id),
    ]);
    (empresasData ?? [])
      .filter((e: { id: string; nome: string }) => !comAtiv.has(e.id))
      .slice(0, 6)
      .forEach((e: { id: string; nome: string }) =>
        diags.push({ tipo: "D1", empresa: e.nome, dias: 14, link: "/empresas", acao: `Registrar atividade — ${e.nome}` })
      );

    // D2 — pipeline esfriando (+7 dias sem update)
    (negociosData ?? [])
      .filter((n: { updated_at: string }) => {
        if (!n.updated_at) return true;
        return new Date(n.updated_at) < dt7;
      })
      .slice(0, 6)
      .forEach((n: { id: string; nome: string; updated_at: string }) => {
        const dias = Math.floor((Date.now() - new Date(n.updated_at).getTime()) / 86400000);
        diags.push({ tipo: "D2", negocio: n.nome, dias, link: "/negocios", acao: `Atualizar pipeline — ${n.nome}` });
      });

    // D3 — empresas sem pipeline ativo
    const comPipeline = new Set((negociosData ?? []).map((n: { empresa_id: string }) => n.empresa_id));
    (empresasData ?? [])
      .filter((e: { id: string }) => !comPipeline.has(e.id))
      .slice(0, 6)
      .forEach((e: { id: string; nome: string }) =>
        diags.push({ tipo: "D3", empresa: e.nome, link: "/negocios", acao: `Criar pipeline — ${e.nome}` })
      );

    setDiagnosticos(diags);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleComplete(id: string) {
    setCompleting(id);
    await supabase.from("tarefas").update({ status: "Concluída" }).eq("id", id);
    setCompleting(null);
    setTarefasHoje((p) => p.filter((t) => t.id !== id));
    setTarefasPendentes((p) => p.filter((t) => t.id !== id));
  }

  const d1 = diagnosticos.filter((d) => d.tipo === "D1");
  const d2 = diagnosticos.filter((d) => d.tipo === "D2");
  const d3 = diagnosticos.filter((d) => d.tipo === "D3");

  return (
    <Shell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-outfit text-slate-900 dark:text-white">Agenda do Dia</h1>
            <p className="text-sm text-slate-500 capitalize">
              {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-slate-500 hover:text-unifique-primary border border-slate-200 rounded-xl hover:border-unifique-primary/40 transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Atualizar
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Compromissos hoje", value: tarefasHoje.length, icon: CalendarCheck, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
            { label: "Tarefas pendentes", value: tarefasPendentes.length, icon: Clock, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20" },
            { label: "Sem atividade +14d", value: d1.length, icon: AlertCircle, color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20" },
            { label: "Pipeline esfriando", value: d2.length, icon: TrendingDown, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/20" },
            { label: "Sem pipeline", value: d3.length, icon: Building2, color: "text-slate-500", bg: "bg-slate-100 dark:bg-slate-800" },
          ].map((k) => (
            <div key={k.label} className="glass-card p-4 flex items-center gap-3">
              <div className={cn("p-2 rounded-lg flex-shrink-0", k.bg)}>
                <k.icon size={16} className={k.color} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate leading-tight">{k.label}</p>
                <p className={cn("text-xl font-bold font-outfit", k.color)}>{loading ? "—" : k.value}</p>
              </div>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={32} className="animate-spin text-unifique-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ─── Coluna esquerda ─── */}
            <div className="space-y-5">
              {/* Agenda de Hoje */}
              <div className="glass-card overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 dark:border-white/5 flex items-center gap-2">
                  <CalendarCheck size={15} className="text-unifique-primary" />
                  <h2 className="font-bold text-sm">Agenda de Hoje</h2>
                  <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-unifique-primary/10 text-unifique-primary">
                    {tarefasHoje.length}
                  </span>
                </div>
                {tarefasHoje.length === 0 ? (
                  <div className="p-10 flex flex-col items-center gap-2 text-slate-400">
                    <CheckCircle2 size={24} />
                    <p className="text-sm font-medium">Nenhum compromisso para hoje.</p>
                    <Link href="/atividades" className="text-xs text-unifique-primary font-bold hover:underline">
                      Criar atividade →
                    </Link>
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-50 dark:divide-white/5">
                    {tarefasHoje.map((t) => (
                      <li key={t.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                        <button
                          onClick={() => handleComplete(t.id)}
                          disabled={completing === t.id}
                          className="w-5 h-5 rounded-full border-2 border-slate-300 hover:border-unifique-primary flex items-center justify-center transition-all flex-shrink-0 disabled:opacity-50"
                        >
                          {completing === t.id && <Loader2 size={10} className="animate-spin text-unifique-primary" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{t.titulo}</p>
                          {t.empresa_nome && (
                            <p className="text-[10px] text-unifique-primary font-medium">{t.empresa_nome}</p>
                          )}
                        </div>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 dark:bg-white/10 text-slate-500 rounded flex-shrink-0">
                          {t.tipo}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Tarefas Pendentes */}
              <div className="glass-card overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 dark:border-white/5 flex items-center gap-2">
                  <Clock size={15} className="text-amber-500" />
                  <h2 className="font-bold text-sm">Tarefas Pendentes</h2>
                  <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-600">
                    {tarefasPendentes.length}
                  </span>
                </div>
                {tarefasPendentes.length === 0 ? (
                  <div className="p-10 flex flex-col items-center gap-2 text-slate-400">
                    <CheckCircle2 size={24} />
                    <p className="text-sm font-medium">Sem tarefas pendentes próximas.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-50 dark:divide-white/5">
                    {tarefasPendentes.map((t) => {
                      const vencida = t.prazo && new Date(t.prazo + "T23:59:59") < new Date();
                      return (
                        <li key={t.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                          <button
                            onClick={() => handleComplete(t.id)}
                            disabled={completing === t.id}
                            className="w-5 h-5 rounded-full border-2 border-slate-300 hover:border-unifique-primary flex items-center justify-center transition-all flex-shrink-0 disabled:opacity-50"
                          >
                            {completing === t.id && <Loader2 size={10} className="animate-spin text-unifique-primary" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{t.titulo}</p>
                            {t.empresa_nome && (
                              <p className="text-[10px] text-unifique-primary font-medium">{t.empresa_nome}</p>
                            )}
                          </div>
                          <span
                            className={cn(
                              "text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0",
                              vencida ? "bg-red-100 text-red-600" : "bg-slate-100 dark:bg-white/10 text-slate-500"
                            )}
                          >
                            {vencida
                              ? "VENCIDA"
                              : new Date(t.prazo + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            {/* ─── Coluna direita ─── */}
            <div className="space-y-5">
              {/* Diagnóstico */}
              <div className="glass-card overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 dark:border-white/5 flex items-center gap-2">
                  <AlertTriangle size={15} className="text-red-500" />
                  <h2 className="font-bold text-sm">Diagnóstico</h2>
                  <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                    {diagnosticos.length}
                  </span>
                </div>
                <div className="p-5 space-y-4">
                  {(
                    [
                      { tipo: "D1", label: "Contas sem atividade há +14 dias", items: d1, badgeClass: "bg-red-100 text-red-700" },
                      { tipo: "D2", label: "Pipeline sem atualização há +7 dias", items: d2, badgeClass: "bg-orange-100 text-orange-700" },
                      { tipo: "D3", label: "Empresas sem pipeline ativo", items: d3, badgeClass: "bg-slate-100 text-slate-600" },
                    ] as const
                  ).map(({ tipo, label, items, badgeClass }) => (
                    <div key={tipo}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded", badgeClass)}>{tipo}</span>
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{label}</span>
                        <span className="ml-auto text-xs font-bold text-slate-400">{items.length}</span>
                      </div>
                      {items.length > 0 ? (
                        <ul className="space-y-1 pl-6">
                          {items.slice(0, 4).map((d, i) => (
                            <li key={i} className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              • {d.empresa ?? d.negocio}
                              {d.dias !== undefined && <span className="text-slate-400"> — {d.dias}d</span>}
                            </li>
                          ))}
                          {items.length > 4 && (
                            <li className="text-[10px] text-slate-400">+{items.length - 4} mais</li>
                          )}
                        </ul>
                      ) : (
                        <p className="text-[11px] text-emerald-600 pl-6 font-medium">✓ Tudo em dia</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Plano de Ação */}
              <div className="glass-card overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 dark:border-white/5 flex items-center gap-2">
                  <Briefcase size={15} className="text-unifique-primary" />
                  <h2 className="font-bold text-sm">Plano de Ação</h2>
                  <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-unifique-primary/10 text-unifique-primary">
                    {diagnosticos.length}
                  </span>
                </div>
                {diagnosticos.length === 0 ? (
                  <div className="p-10 flex flex-col items-center gap-2 text-emerald-500">
                    <CheckCircle size={28} />
                    <p className="text-sm font-bold">Nenhuma ação necessária!</p>
                    <p className="text-xs text-slate-400 mt-0.5">Todas as contas estão em dia.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-50 dark:divide-white/5">
                    {diagnosticos.slice(0, 10).map((d, i) => (
                      <li key={i} className="flex items-start gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                        <span
                          className={cn(
                            "text-[8px] font-bold px-1 py-0.5 rounded mt-0.5 flex-shrink-0",
                            d.tipo === "D1" ? "bg-red-100 text-red-700" :
                            d.tipo === "D2" ? "bg-orange-100 text-orange-700" :
                            "bg-slate-100 text-slate-600"
                          )}
                        >
                          {d.tipo}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{d.acao}</p>
                          {d.dias !== undefined && (
                            <p className="text-[10px] text-slate-400">{d.dias} dias sem atualização</p>
                          )}
                        </div>
                        <Link
                          href={d.link}
                          className="text-[10px] font-bold text-unifique-primary hover:underline flex-shrink-0 mt-0.5"
                        >
                          Acessar →
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
