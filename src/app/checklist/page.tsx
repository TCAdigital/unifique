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
  ChevronRight,
  Search,
  X,
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

type DiagTipo = "D1" | "D2" | "D3";

interface DiagItem {
  tipo: DiagTipo;
  id: string;
  empresa?: string;
  negocio?: string;
  status?: string;
  dias?: number;
  link: string;
  acao: string;
}

interface EmpresaDiag {
  id: string;
  nome: string;
  status: string | null;
}

interface NegocioDiag {
  id: string;
  nome: string;
  empresa_id: string | null;
  fase: string;
  updated_at: string | null;
  empresas?: { nome: string; status: string | null } | { nome: string; status: string | null }[] | null;
}

/** Lê o status da empresa vinculada, aceitando relação única ou array (join do PostgREST). */
function statusDoNegocio(n: NegocioDiag): { nome: string; status: string | null } {
  const rel = n.empresas;
  if (!rel) return { nome: "—", status: null };
  if (Array.isArray(rel)) return { nome: rel[0]?.nome ?? "—", status: rel[0]?.status ?? null };
  return { nome: rel.nome, status: rel.status };
}

const PRIORIDADE_ORDER: Record<string, number> = { Crítica: 0, Alta: 1, Média: 2, Baixa: 3 };

/**
 * Regras de status do Diagnóstico da Agenda do Dia.
 * Contas com status "Lead" ficam FORA do diagnóstico — quem trabalha o lead é o
 * Agente SDR (fila de prospecção em /agentes), que o converte em Negociando/Ativo.
 */
const STATUS_D1 = ["Ativo", "Negociando"]; // contas sem atividade há +14 dias
const STATUS_D2_D3 = ["Ativo"];            // pipeline esfriando +7d / conta sem pipeline

const DIAG_META: Record<DiagTipo, { label: string; descricao: string; badgeClass: string; dotClass: string }> = {
  D1: {
    label: "Contas sem atividade há +14 dias",
    descricao: "Status Ativo e Negociando",
    badgeClass: "bg-red-100 text-red-700",
    dotClass: "text-red-500",
  },
  D2: {
    label: "Pipeline sem atualização há +7 dias",
    descricao: "Somente contas Ativas",
    badgeClass: "bg-orange-100 text-orange-700",
    dotClass: "text-orange-500",
  },
  D3: {
    label: "Empresas sem pipeline ativo",
    descricao: "Somente contas Ativas",
    badgeClass: "bg-slate-100 text-slate-600",
    dotClass: "text-slate-500",
  },
};

const STATUS_BADGE: Record<string, string> = {
  Ativo: "bg-emerald-100 text-emerald-700",
  Negociando: "bg-blue-100 text-blue-700",
  Lead: "bg-slate-100 text-slate-600",
};

export default function ChecklistPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tarefasHoje, setTarefasHoje] = useState<TarefaItem[]>([]);
  const [tarefasPendentes, setTarefasPendentes] = useState<TarefaItem[]>([]);
  const [diagnosticos, setDiagnosticos] = useState<DiagItem[]>([]);
  const [completing, setCompleting] = useState<string | null>(null);
  const [drill, setDrill] = useState<DiagTipo | null>(null);
  const [drillBusca, setDrillBusca] = useState("");

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

      supabase.from("empresas").select("id, nome, status").order("nome"),

      supabase
        .from("negocios")
        .select("id, nome, empresa_id, fase, updated_at, empresas(nome, status)")
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
    const empresas = (empresasData ?? []) as EmpresaDiag[];
    const negocios = (negociosData ?? []) as NegocioDiag[];

    // D1 — contas sem atividade há +14 dias (somente Ativo e Negociando)
    const comAtiv = new Set([
      ...(tarefasRecentesData ?? []).map((t: { empresa_id: string }) => t.empresa_id).filter(Boolean),
      ...(notasRecentesData ?? []).map((n: { entidade_id: string }) => n.entidade_id),
    ]);
    empresas
      .filter((e) => STATUS_D1.includes(e.status ?? ""))
      .filter((e) => !comAtiv.has(e.id))
      .forEach((e) =>
        diags.push({
          tipo: "D1",
          id: e.id,
          empresa: e.nome,
          status: e.status ?? undefined,
          dias: 14,
          link: "/empresas",
          acao: `Registrar atividade — ${e.nome}`,
        })
      );

    // D2 — pipeline esfriando (+7 dias sem update), somente contas Ativas
    negocios
      .filter((n) => STATUS_D2_D3.includes(statusDoNegocio(n).status ?? ""))
      .filter((n) => {
        if (!n.updated_at) return true;
        return new Date(n.updated_at) < dt7;
      })
      .forEach((n) => {
        const dias = n.updated_at
          ? Math.floor((Date.now() - new Date(n.updated_at).getTime()) / 86400000)
          : 0;
        const meta = statusDoNegocio(n);
        diags.push({
          tipo: "D2",
          id: n.id,
          negocio: n.nome,
          empresa: meta.nome,
          status: meta.status ?? undefined,
          dias,
          link: "/negocios",
          acao: `Atualizar pipeline — ${n.nome}`,
        });
      });

    // D3 — empresas Ativas sem pipeline ativo
    const comPipeline = new Set(negocios.map((n) => n.empresa_id).filter(Boolean));
    empresas
      .filter((e) => STATUS_D2_D3.includes(e.status ?? ""))
      .filter((e) => !comPipeline.has(e.id))
      .forEach((e) =>
        diags.push({
          tipo: "D3",
          id: e.id,
          empresa: e.nome,
          status: e.status ?? undefined,
          link: "/negocios",
          acao: `Criar pipeline — ${e.nome}`,
        })
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
  const diagPorTipo: Record<DiagTipo, DiagItem[]> = { D1: d1, D2: d2, D3: d3 };
  const drillItems = drill ? diagPorTipo[drill] : [];

  const termoBusca = drillBusca.trim().toLowerCase();
  const drillFiltrados = termoBusca
    ? drillItems.filter(
        (d) =>
          (d.empresa ?? "").toLowerCase().includes(termoBusca) ||
          (d.negocio ?? "").toLowerCase().includes(termoBusca) ||
          (d.status ?? "").toLowerCase().includes(termoBusca)
      )
    : drillItems;

  useEffect(() => {
    if (!drill) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrill(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drill]);

  function abrirDrill(tipo: DiagTipo) {
    setDrillBusca("");
    setDrill(tipo);
  }

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
            { label: "Compromissos hoje", value: tarefasHoje.length, icon: CalendarCheck, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20", diag: null as DiagTipo | null },
            { label: "Tarefas pendentes", value: tarefasPendentes.length, icon: Clock, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20", diag: null as DiagTipo | null },
            { label: "Sem atividade +14d", value: d1.length, icon: AlertCircle, color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20", diag: "D1" as DiagTipo | null },
            { label: "Pipeline esfriando", value: d2.length, icon: TrendingDown, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/20", diag: "D2" as DiagTipo | null },
            { label: "Sem pipeline", value: d3.length, icon: Building2, color: "text-slate-500", bg: "bg-slate-100 dark:bg-slate-800", diag: "D3" as DiagTipo | null },
          ].map((k) => {
            const conteudo = (
              <>
                <div className={cn("p-2 rounded-lg flex-shrink-0", k.bg)}>
                  <k.icon size={16} className={k.color} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate leading-tight">{k.label}</p>
                  <p className={cn("text-xl font-bold font-outfit", k.color)}>{loading ? "—" : k.value}</p>
                </div>
              </>
            );

            return k.diag ? (
              <button
                key={k.label}
                type="button"
                onClick={() => abrirDrill(k.diag as DiagTipo)}
                title={`Ver contas — ${DIAG_META[k.diag].label}`}
                className="glass-card p-4 flex items-center gap-3 text-left hover:border-unifique-primary/40 hover:shadow-md transition-all"
              >
                {conteudo}
              </button>
            ) : (
              <div key={k.label} className="glass-card p-4 flex items-center gap-3">
                {conteudo}
              </div>
            );
          })}
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
                  {(["D1", "D2", "D3"] as DiagTipo[]).map((tipo) => {
                    const meta = DIAG_META[tipo];
                    const items = diagPorTipo[tipo];
                    return (
                      <div key={tipo}>
                        <button
                          type="button"
                          onClick={() => items.length > 0 && abrirDrill(tipo)}
                          disabled={items.length === 0}
                          className={cn(
                            "w-full flex items-center gap-2 mb-2 text-left rounded-lg px-1.5 py-1 -mx-1.5 transition-all",
                            items.length > 0 && "hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer"
                          )}
                          title={items.length > 0 ? `Ver todas as ${items.length} contas` : meta.label}
                        >
                          <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0", meta.badgeClass)}>{tipo}</span>
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{meta.label}</span>
                          <span className="text-[10px] text-slate-400 hidden sm:inline">· {meta.descricao}</span>
                          <span className="ml-auto text-xs font-bold text-slate-400 flex-shrink-0">{items.length}</span>
                          {items.length > 0 && <ChevronRight size={12} className="text-slate-300 flex-shrink-0" />}
                        </button>
                        {items.length > 0 ? (
                          <>
                            <ul className="space-y-1 pl-6">
                              {items.slice(0, 4).map((d) => (
                                <li key={`${d.tipo}-${d.id}`}>
                                  <Link
                                    href={d.link}
                                    className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 hover:text-unifique-primary transition-all"
                                    title={d.acao}
                                  >
                                    <span className="truncate">• {d.empresa ?? d.negocio}</span>
                                    {d.dias !== undefined && (
                                      <span className="text-slate-400 flex-shrink-0">— {d.dias}d</span>
                                    )}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                            {items.length > 4 && (
                              <button
                                type="button"
                                onClick={() => abrirDrill(tipo)}
                                className="ml-6 mt-1 text-[10px] font-bold text-unifique-primary hover:underline"
                              >
                                Ver todas as {items.length} contas →
                              </button>
                            )}
                          </>
                        ) : (
                          <p className="text-[11px] text-emerald-600 pl-6 font-medium">✓ Tudo em dia</p>
                        )}
                      </div>
                    );
                  })}
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
      {/* Drill-down do Diagnóstico */}
      {drill && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          onClick={() => setDrill(null)}
          role="dialog"
          aria-modal="true"
          aria-label={DIAG_META[drill].label}
        >
          <div
            className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-100 dark:border-white/10 flex items-start gap-3">
              <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5 flex-shrink-0", DIAG_META[drill].badgeClass)}>
                {drill}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">{DIAG_META[drill].label}</h3>
                <p className="text-[11px] text-slate-500">
                  {DIAG_META[drill].descricao} · {drillItems.length} conta{drillItems.length === 1 ? "" : "s"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDrill(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all flex-shrink-0"
                aria-label="Fechar"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-5 py-3 border-b border-slate-100 dark:border-white/10">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={drillBusca}
                  onChange={(e) => setDrillBusca(e.target.value)}
                  placeholder="Buscar conta por nome ou status..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-unifique-primary/30"
                  autoFocus
                />
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              {drillFiltrados.length === 0 ? (
                <p className="p-10 text-center text-xs text-slate-400">Nenhuma conta encontrada para este filtro.</p>
              ) : (
                <ul className="divide-y divide-slate-50 dark:divide-white/5">
                  {drillFiltrados.map((d) => (
                    <li key={`${d.tipo}-${d.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{d.empresa ?? d.negocio}</p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {d.tipo === "D2"
                            ? `${d.empresa} · ${d.negocio}${d.dias !== undefined ? ` · ${d.dias}d sem atualização` : ""}`
                            : d.tipo === "D1"
                              ? `${d.status} · +${d.dias}d sem atividade registrada`
                              : `${d.status} · sem pipeline ativo`}
                        </p>
                      </div>
                      {d.status && (
                        <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0", STATUS_BADGE[d.status] ?? STATUS_BADGE.Lead)}>
                          {d.status}
                        </span>
                      )}
                      <Link
                        href={d.link}
                        onClick={() => setDrill(null)}
                        className="text-[10px] font-bold text-unifique-primary hover:underline flex-shrink-0"
                      >
                        Acessar →
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="px-5 py-3 border-t border-slate-100 dark:border-white/10 bg-slate-50/60 dark:bg-white/5">
              <p className="text-[10px] text-slate-500 leading-relaxed">
                D1 considera contas <strong>Ativo e Negociando</strong>. D2 e D3 consideram apenas contas <strong>Ativas</strong>.
                Contas com status <strong>Lead</strong> são trabalhadas pelo Agente SDR na fila de prospecção.
              </p>
              <Link href="/agentes" className="text-[10px] font-bold text-unifique-primary hover:underline">
                Abrir Agentes IA / Fila SDR →
              </Link>
            </div>
          </div>
        </div>
      )}
      </div>
    </Shell>
  );
}
