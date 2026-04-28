"use client";

import { useState, useEffect } from "react";
import { Shell } from "@/components/layout/Shell";
import { supabase } from "@/lib/supabase";
import { formatCurrency, cn } from "@/lib/utils";
import type { OkrLancamento } from "@/types";
import {
  Flag,
  Plus,
  BarChart2,
  Users,
  Target,
  TrendingUp,
  DollarSign,
  Loader2,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const ANO = 2026;
const METAS = { eventos: 8, leads: 320, mqls: 96, sqls: 15 };

type Aba = "painel" | "lancar" | "historico" | "cac" | "ia";

const ABA_LABELS: { key: Aba; label: string }[] = [
  { key: "painel", label: "Painel" },
  { key: "lancar", label: "Lançar" },
  { key: "historico", label: "Histórico" },
  { key: "cac", label: "CAC & LTV" },
  { key: "ia", label: "Análise IA" },
];

const FORM_VAZIO = {
  mes_idx: new Date().getMonth(),
  eventos: "",
  leads: "",
  mqls: "",
  sqls: "",
  presencial: "",
  online: "",
  custo: "",
  clientes: "",
  ltv: "",
};

function PBar({ pct, color = "bg-unifique-primary" }: { pct: number; color?: string }) {
  return (
    <div className="w-full h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
      <div className={cn("h-full rounded-full transition-all duration-700", color)} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  );
}

export default function OkrPage() {
  const [aba, setAba] = useState<Aba>("painel");
  const [lancamentos, setLancamentos] = useState<OkrLancamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(FORM_VAZIO);
  const [analiseIA, setAnaliseIA] = useState("");
  const [loadingIA, setLoadingIA] = useState(false);
  const [erroIA, setErroIA] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const { data } = await supabase
      .from("okr_lancamentos")
      .select("*")
      .eq("ano", ANO)
      .order("mes_idx");
    setLancamentos((data as OkrLancamento[]) ?? []);
    setLoading(false);
  }

  async function handleSalvar() {
    const mesExiste = lancamentos.find((l) => l.mes_idx === Number(form.mes_idx));
    if (mesExiste) return;
    setSaving(true);
    await supabase.from("okr_lancamentos").insert({
      mes_idx: Number(form.mes_idx),
      ano: ANO,
      eventos: Number(form.eventos) || 0,
      leads: Number(form.leads) || 0,
      mqls: Number(form.mqls) || 0,
      sqls: Number(form.sqls) || 0,
      presencial: Number(form.presencial) || 0,
      online: Number(form.online) || 0,
      custo: Number(form.custo) || 0,
      clientes: Number(form.clientes) || 0,
      ltv: Number(form.ltv) || 0,
      saved: true,
    });
    setForm(FORM_VAZIO);
    setSaving(false);
    loadData();
    setAba("historico");
  }

  async function handleAnaliseIA() {
    if (lancamentos.length === 0) {
      setErroIA("Nenhum dado lançado ainda. Lance pelo menos um mês antes de gerar a análise.");
      return;
    }
    setLoadingIA(true);
    setErroIA("");
    setAnaliseIA("");
    try {
      const res = await fetch("/api/okr-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dados: {
            ano: ANO,
            metas: METAS,
            meses: lancamentos.map((l) => ({
              mes: MESES[l.mes_idx],
              eventos: l.eventos,
              leads: l.leads,
              mqls: l.mqls,
              sqls: l.sqls,
              custo: l.custo,
              clientes: l.clientes,
              ltv: l.ltv,
            })),
          },
        }),
      });
      if (!res.ok) throw new Error("Erro na API");
      const json = await res.json();
      setAnaliseIA(json.analise);
    } catch {
      setErroIA("Não foi possível gerar a análise. Verifique se ANTHROPIC_API_KEY está configurada.");
    }
    setLoadingIA(false);
  }

  // Aggregates
  const totEvt = lancamentos.reduce((s, l) => s + l.eventos, 0);
  const totLd = lancamentos.reduce((s, l) => s + l.leads, 0);
  const totMQL = lancamentos.reduce((s, l) => s + l.mqls, 0);
  const totSQL = lancamentos.reduce((s, l) => s + l.sqls, 0);
  const totCusto = lancamentos.reduce((s, l) => s + l.custo, 0);
  const totClientes = lancamentos.reduce((s, l) => s + l.clientes, 0);
  const totLTV = lancamentos.reduce((s, l) => s + l.ltv, 0);

  const pctEvt = Math.round((totEvt / METAS.eventos) * 100);
  const pctLd = Math.round((totLd / METAS.leads) * 100);
  const pctMQL = Math.round((totMQL / METAS.mqls) * 100);
  const pctSQL = Math.round((totSQL / METAS.sqls) * 100);

  const cac = totClientes > 0 ? totCusto / totClientes : 0;
  const ltvMedio = totClientes > 0 ? totLTV / totClientes : 0;
  const ltvCacRatio = cac > 0 ? ltvMedio / cac : 0;

  const mesesLancados = new Set(lancamentos.map((l) => l.mes_idx));

  const KR_ITEMS = [
    { label: "Eventos realizados", atual: totEvt, meta: METAS.eventos, pct: pctEvt, unit: "", color: "bg-unifique-primary" },
    { label: "Leads captados", atual: totLd, meta: METAS.leads, pct: pctLd, unit: "", color: "bg-unifique-cyan" },
    { label: "MQLs", atual: totMQL, meta: METAS.mqls, pct: pctMQL, unit: "", color: "bg-purple-500" },
    { label: "SQLs", atual: totSQL, meta: METAS.sqls, pct: pctSQL, unit: "", color: "bg-emerald-500" },
  ];

  return (
    <Shell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-outfit">
              OKR Eventos TIC B2B
            </h1>
            <p className="text-slate-500 mt-1">Metas anuais {ANO} · Rede Unifique</p>
          </div>
          <button
            onClick={() => setAba("lancar")}
            className="flex items-center gap-2 px-4 py-2 bg-unifique-primary text-white rounded-xl text-sm font-bold hover:scale-[1.02] transition-all shadow-lg shadow-unifique-primary/25"
          >
            <Plus size={16} /> Lançar Mês
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl w-fit flex-wrap">
          {ABA_LABELS.map((a) => (
            <button
              key={a.key}
              onClick={() => setAba(a.key)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                aba === a.key
                  ? "bg-white dark:bg-white/10 text-unifique-primary shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              )}
            >
              {a.label}
              {a.key === "ia" && <Sparkles size={12} className="inline ml-1 text-amber-400" />}
            </button>
          ))}
        </div>

        {/* PAINEL */}
        {aba === "painel" && (
          <div className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-slate-400">
                <Loader2 size={28} className="animate-spin" />
              </div>
            ) : (
              <>
                {/* KR cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {KR_ITEMS.map((kr) => (
                    <div key={kr.label} className="glass-card p-5">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{kr.label}</p>
                        <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", kr.pct >= 100 ? "bg-emerald-100 text-emerald-700" : kr.pct >= 70 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-600")}>
                          {kr.pct}%
                        </span>
                      </div>
                      <p className="text-2xl font-bold font-outfit mb-3">{kr.atual}<span className="text-sm font-normal text-slate-400">/{kr.meta}</span></p>
                      <PBar pct={kr.pct} color={kr.color} />
                    </div>
                  ))}
                </div>

                {/* Taxas de conversão */}
                <div className="glass-card p-6">
                  <h3 className="font-bold text-sm mb-5">Taxas de Conversão do Funil</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                      { label: "Lead → MQL", value: totLd > 0 ? ((totMQL / totLd) * 100).toFixed(1) : "0", ref: "25-35%" },
                      { label: "MQL → SQL", value: totMQL > 0 ? ((totSQL / totMQL) * 100).toFixed(1) : "0", ref: "10-20%" },
                      { label: "SQL → Cliente", value: totSQL > 0 ? ((totClientes / totSQL) * 100).toFixed(1) : "0", ref: "30-50%" },
                      { label: "Presença Online", value: lancamentos.reduce((s, l) => s + l.online, 0).toString(), ref: `de ${lancamentos.reduce((s, l) => s + l.presencial + l.online, 0)} eventos` },
                    ].map((t) => (
                      <div key={t.label} className="text-center p-3 bg-slate-50 dark:bg-white/5 rounded-xl">
                        <p className="text-2xl font-bold font-outfit text-unifique-primary">{t.value}{t.label.includes("→") ? "%" : ""}</p>
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-1">{t.label}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Ref: {t.ref}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tabela mensal */}
                {lancamentos.length > 0 && (
                  <div className="glass-card overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5">
                      <h3 className="font-bold text-sm">Dados por Mês</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-white/5">
                            {["Mês", "Eventos", "Leads", "MQLs", "SQLs", "Custo", "Clientes", "LTV"].map((h) => (
                              <th key={h} className="px-4 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                          {lancamentos.map((l) => (
                            <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                              <td className="px-4 py-3 font-bold">{MESES[l.mes_idx]}</td>
                              <td className="px-4 py-3">{l.eventos}</td>
                              <td className="px-4 py-3 text-unifique-primary font-medium">{l.leads}</td>
                              <td className="px-4 py-3">{l.mqls}</td>
                              <td className="px-4 py-3 text-emerald-600 font-medium">{l.sqls}</td>
                              <td className="px-4 py-3 text-red-500">{formatCurrency(l.custo)}</td>
                              <td className="px-4 py-3">{l.clientes}</td>
                              <td className="px-4 py-3 text-unifique-primary font-medium">{formatCurrency(l.ltv)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* LANÇAR */}
        {aba === "lancar" && (
          <div className="glass-card p-6 max-w-2xl">
            <h2 className="font-bold text-lg mb-6">Lançar dados do mês</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Mês *</label>
                <select
                  value={form.mes_idx}
                  onChange={(e) => setForm({ ...form, mes_idx: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 rounded-lg text-sm bg-white dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-unifique-primary/30"
                >
                  {MESES.map((m, i) => (
                    <option key={m} value={i} disabled={mesesLancados.has(i)}>
                      {m}/{ANO} {mesesLancados.has(i) ? "(já lançado)" : ""}
                    </option>
                  ))}
                </select>
              </div>
              {[
                { key: "eventos", label: "Eventos realizados" },
                { key: "leads", label: "Leads captados" },
                { key: "mqls", label: "MQLs" },
                { key: "sqls", label: "SQLs" },
                { key: "presencial", label: "Visitas presenciais" },
                { key: "online", label: "Participações online" },
                { key: "clientes", label: "Novos clientes gerados" },
                { key: "custo", label: "Custo total (R$)" },
                { key: "ltv", label: "LTV estimado total (R$)" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">{label}</label>
                  <input
                    type="number"
                    value={(form as any)[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 rounded-lg text-sm bg-white dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-unifique-primary/30"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSalvar}
                disabled={saving || mesesLancados.has(Number(form.mes_idx))}
                className="flex items-center gap-2 px-6 py-2.5 bg-unifique-primary text-white rounded-lg text-sm font-bold hover:bg-unifique-primary/90 disabled:opacity-60 transition-all"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Salvar Lançamento
              </button>
              {mesesLancados.has(Number(form.mes_idx)) && (
                <p className="text-xs text-amber-600 flex items-center gap-1 self-center">
                  <AlertCircle size={13} /> Este mês já foi lançado
                </p>
              )}
            </div>
          </div>
        )}

        {/* HISTÓRICO */}
        {aba === "historico" && (
          <div>
            {loading ? (
              <div className="flex items-center justify-center py-16 text-slate-400"><Loader2 size={28} className="animate-spin" /></div>
            ) : lancamentos.length === 0 ? (
              <div className="glass-card flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                <Flag size={36} />
                <p className="text-sm">Nenhum mês lançado ainda.</p>
                <button onClick={() => setAba("lancar")} className="px-4 py-2 bg-unifique-primary text-white rounded-lg text-xs font-bold">
                  Lançar primeiro mês
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lancamentos.map((l) => (
                  <div key={l.id} className="glass-card p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-sm">{MESES[l.mes_idx]}/{ANO}</h3>
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                        <CheckCircle2 size={10} /> Lançado
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        { label: "Eventos", v: l.eventos },
                        { label: "Leads", v: l.leads },
                        { label: "MQLs", v: l.mqls },
                        { label: "SQLs", v: l.sqls },
                        { label: "Clientes", v: l.clientes },
                        { label: "Custo", v: formatCurrency(l.custo) },
                      ].map(({ label, v }) => (
                        <div key={label} className="p-2 bg-slate-50 dark:bg-white/5 rounded">
                          <p className="text-[10px] text-slate-400">{label}</p>
                          <p className="font-bold">{v}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CAC & LTV */}
        {aba === "cac" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: "CAC Médio", value: formatCurrency(cac), icon: DollarSign, color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20", desc: "Custo total ÷ Clientes" },
                { label: "LTV Médio", value: formatCurrency(ltvMedio), icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20", desc: "LTV total ÷ Clientes" },
                { label: "LTV/CAC Ratio", value: ltvCacRatio.toFixed(1) + "x", icon: Target, color: ltvCacRatio >= 4 ? "text-emerald-600" : "text-amber-600", bg: ltvCacRatio >= 4 ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-amber-50 dark:bg-amber-900/20", desc: "Ideal: ≥ 4x" },
              ].map((k) => (
                <div key={k.label} className="glass-card p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={cn("p-2.5 rounded-xl", k.bg)}><k.icon size={18} className={k.color} /></div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{k.label}</p>
                  </div>
                  <p className={cn("text-2xl font-bold font-outfit", k.color)}>{k.value}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{k.desc}</p>
                </div>
              ))}
            </div>

            <div className="glass-card p-6">
              <h3 className="font-bold text-sm mb-4">Referências de Mercado B2B TIC</h3>
              <div className="space-y-3">
                {[
                  { metrica: "LTV/CAC", ideal: "≥ 4:1", status: ltvCacRatio >= 4 ? "ok" : "warning", atual: `${ltvCacRatio.toFixed(1)}x` },
                  { metrica: "Taxa Lead → MQL", ideal: "25–35%", status: totLd > 0 && (totMQL / totLd) >= 0.25 ? "ok" : "warning", atual: totLd > 0 ? `${((totMQL / totLd) * 100).toFixed(1)}%` : "—" },
                  { metrica: "Taxa MQL → SQL", ideal: "10–20%", status: totMQL > 0 && (totSQL / totMQL) >= 0.1 ? "ok" : "warning", atual: totMQL > 0 ? `${((totSQL / totMQL) * 100).toFixed(1)}%` : "—" },
                  { metrica: "Payback Period", ideal: "≤ 12 meses", status: "info", atual: cac > 0 && ltvMedio > 0 ? `${(cac / (ltvMedio / 12)).toFixed(1)} meses` : "—" },
                ].map((r) => (
                  <div key={r.metrica} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-white/5 rounded-xl">
                    <div className={cn("w-2 h-2 rounded-full flex-shrink-0", r.status === "ok" ? "bg-emerald-500" : r.status === "warning" ? "bg-amber-500" : "bg-blue-500")} />
                    <span className="text-sm font-medium flex-1">{r.metrica}</span>
                    <span className="text-xs text-slate-400">Ideal: {r.ideal}</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 min-w-[60px] text-right">{r.atual}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ANÁLISE IA */}
        {aba === "ia" && (
          <div className="space-y-6">
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20">
                  <Sparkles size={20} className="text-amber-500" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Diagnóstico Estratégico por IA</h3>
                  <p className="text-xs text-slate-500">Claude Sonnet · Análise dos dados de eventos TIC B2B</p>
                </div>
              </div>

              {erroIA && (
                <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg text-xs mb-4">
                  <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                  {erroIA}
                </div>
              )}

              {analiseIA ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <div className="p-5 bg-slate-50 dark:bg-white/5 rounded-xl text-sm leading-relaxed whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                    {analiseIA}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <Sparkles size={36} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm mb-1">Nenhuma análise gerada ainda.</p>
                  <p className="text-xs">Clique em "Gerar Análise" para obter um diagnóstico estratégico baseado nos dados lançados.</p>
                </div>
              )}

              <button
                onClick={handleAnaliseIA}
                disabled={loadingIA || lancamentos.length === 0}
                className="mt-5 flex items-center gap-2 px-6 py-2.5 bg-unifique-primary text-white rounded-lg text-sm font-bold hover:bg-unifique-primary/90 disabled:opacity-60 transition-all"
              >
                {loadingIA ? (
                  <><Loader2 size={14} className="animate-spin" /> Analisando...</>
                ) : (
                  <><Sparkles size={14} /> {analiseIA ? "Reanalisar" : "Gerar Análise"}</>
                )}
              </button>
              {lancamentos.length === 0 && (
                <p className="text-xs text-slate-400 mt-2">Lance pelo menos um mês antes de gerar a análise.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
