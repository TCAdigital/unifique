"use client";

import React, { useState, useMemo } from "react";
import { Shell } from "@/components/layout/Shell";
import { formatCurrency, cn } from "@/lib/utils";
import { Calculator, TrendingUp, DollarSign, Clock, BarChart3 } from "lucide-react";

// ── Constantes fiscais (BU Cyber / HaaS) ────────────────────────────────────
const TAXA_DEDUCOES   = 0.1225;  // ISS 3% + PIS/COFINS 9,25%
const TAXA_IR         = 0.34;    // IR/CSLL lucro real
const TAXA_DESP_ANO1  = 0.0175;  // despesas comerciais Ano 1
const TAXA_DESP_DEMAIS = 0.01;   // despesas comerciais Anos 2+

// ── NPV ──────────────────────────────────────────────────────────────────────
function npv(rate: number, cfs: number[]): number {
  return cfs.reduce((s, cf, i) => s + cf / Math.pow(1 + rate, i + 1), 0);
}

// ── IRR via Newton-Raphson ────────────────────────────────────────────────────
function irr(cfs: number[]): number | null {
  let r = 0.15;
  for (let k = 0; k < 500; k++) {
    const f = npv(r, cfs);
    const df = cfs.reduce((s, cf, i) => s - (i + 1) * cf / Math.pow(1 + r, i + 2), 0);
    if (Math.abs(df) < 1e-12) break;
    const rn = r - f / df;
    if (Math.abs(rn - r) < 1e-8) return rn;
    r = Math.max(rn, -0.9999);
  }
  return Math.abs(npv(r, cfs)) < 1 ? r : null;
}

// ── Índice de Lucratividade = PV(entradas) / PV(saídas) ─────────────────────
function il(rate: number, cfs: number[]): number | null {
  const pos = cfs.reduce((s, cf, t) => s + (cf > 0 ? cf / Math.pow(1 + rate, t + 1) : 0), 0);
  const neg = Math.abs(cfs.reduce((s, cf, t) => s + (cf < 0 ? cf / Math.pow(1 + rate, t + 1) : 0), 0));
  return neg > 0 ? pos / neg : null;
}

interface AnoProj {
  ano: number;
  receitaBruta: number;
  deducoes: number;
  receitaLiquida: number;
  lucroBruto: number;
  despOp: number;
  ebitda: number;
  depreciacao: number;
  ebit: number;
  irCsll: number;
  lucroLiquido: number;
  nopat: number;
  fcff: number;
  fcffCumul: number;
}

function calcProjecoes(fat: number, capex: number, anos: number): AnoProj[] {
  const rb   = fat * 12;
  const ded  = rb * TAXA_DEDUCOES;
  const rl   = rb - ded;
  const depr = anos > 0 ? capex / anos : 0;
  let cumul  = 0;

  return Array.from({ length: anos }, (_, i) => {
    const t    = i + 1;
    const desp = rb * (t === 1 ? TAXA_DESP_ANO1 : TAXA_DESP_DEMAIS);
    const ebitda   = rl - desp;
    const ebit     = ebitda - depr;
    const ircsll   = Math.max(0, ebit * TAXA_IR);
    const ll       = ebit - ircsll;
    const fcff     = t === 1 ? ll + depr - capex : ll + depr;
    cumul += fcff;
    return {
      ano: t, receitaBruta: rb, deducoes: ded, receitaLiquida: rl,
      lucroBruto: rl, despOp: desp, ebitda, depreciacao: depr,
      ebit, irCsll: ircsll, lucroLiquido: ll, nopat: ll,
      fcff, fcffCumul: cumul,
    };
  });
}

// Payback simples a partir do desembolso do CAPEX (t=0)
function payback(capexVal: number, projecoes: AnoProj[]): number | null {
  let cumul = -capexVal;
  for (const a of projecoes) {
    const opCf = a.nopat + a.depreciacao;
    const prev = cumul;
    cumul += opCf;
    if (cumul >= 0) return (a.ano - 1) + Math.abs(prev) / opCf;
  }
  return null;
}

interface DRELinha { key: keyof AnoProj; label: string; bold?: boolean; neg?: boolean; border?: boolean; hl?: boolean; }

const DRE_LINHAS: DRELinha[] = [
  { key: "receitaBruta",   label: "Receita Bruta",          bold: true },
  { key: "deducoes",       label: "Deduções (12,25%)",       neg: true },
  { key: "receitaLiquida", label: "Receita Líquida",         bold: true, border: true },
  { key: "lucroBruto",     label: "Lucro Bruto",             bold: true },
  { key: "despOp",         label: "Despesas Comerciais",     neg: true },
  { key: "ebitda",         label: "EBITDA",                  bold: true, border: true },
  { key: "depreciacao",    label: "Depreciação",             neg: true },
  { key: "ebit",           label: "EBIT",                    bold: true, border: true },
  { key: "irCsll",         label: "IR/CSLL (34%)",           neg: true },
  { key: "lucroLiquido",   label: "Lucro Líquido",           bold: true, hl: true },
  { key: "nopat",          label: "NOPAT",                   bold: true },
  { key: "fcff",           label: "FCFF",                    bold: true, hl: true },
  { key: "fcffCumul",      label: "FCFF Acumulado",          bold: true },
];

export default function FcffPage() {
  const [fat,      setFat]      = useState("7200");
  const [capexStr, setCapex]    = useState("166872");
  const [vig,      setVig]      = useState("5");
  const [taxaStr,  setTaxa]     = useState("10");

  const f = parseFloat(fat)     || 0;
  const c = parseFloat(capexStr)|| 0;
  const v = Math.max(1, parseInt(vig) || 5);
  const r = (parseFloat(taxaStr) || 10) / 100;

  const projecoes = useMemo(() => calcProjecoes(f, c, v), [f, c, v]);
  const fcffs     = projecoes.map(a => a.fcff);

  const vpl  = useMemo(() => npv(r, fcffs), [r, fcffs]);
  const tir  = useMemo(() => irr(fcffs),    [fcffs]);
  const pb   = useMemo(() => payback(c, projecoes), [c, projecoes]);
  const ilV  = useMemo(() => il(r, fcffs),  [r, fcffs]);

  const inputCls = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all";
  const labelCls = "block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5";

  return (
    <Shell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold font-outfit text-slate-900">Análise FCFF — HaaS</h1>
          <p className="text-sm text-slate-500">Calculadora de viabilidade financeira para contratos Hardware as a Service.</p>
        </div>

        {/* Parâmetros */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calculator size={15} className="text-unifique-primary" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Parâmetros do Contrato</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className={labelCls}>Faturamento Mensal (R$)</label>
              <input type="number" value={fat} onChange={e => setFat(e.target.value)} className={inputCls} placeholder="7200" />
            </div>
            <div>
              <label className={labelCls}>CAPEX — Custo do Hardware (R$)</label>
              <input type="number" value={capexStr} onChange={e => setCapex(e.target.value)} className={inputCls} placeholder="166872" />
            </div>
            <div>
              <label className={labelCls}>Vigência (anos)</label>
              <input type="number" value={vig} min="1" max="10" onChange={e => setVig(e.target.value)} className={inputCls} placeholder="5" />
            </div>
            <div>
              <label className={labelCls}>Taxa de Desconto (%)</label>
              <input type="number" value={taxaStr} step="0.5" onChange={e => setTaxa(e.target.value)} className={inputCls} placeholder="10" />
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "VPL",
              value: formatCurrency(vpl),
              color: vpl >= 0 ? "text-emerald-600" : "text-red-500",
              bg:    vpl >= 0 ? "bg-emerald-50"   : "bg-red-50",
              icon: TrendingUp,
              sub: `Taxa de desconto: ${taxaStr}%`,
            },
            {
              label: "TIR",
              value: tir !== null ? `${(tir * 100).toFixed(1)}%` : "N/D",
              color: (tir ?? 0) > r ? "text-emerald-600" : "text-amber-600",
              bg:    (tir ?? 0) > r ? "bg-emerald-50"   : "bg-amber-50",
              icon: BarChart3,
              sub: (tir ?? 0) > r ? "Acima da taxa de desconto" : "Abaixo da taxa",
            },
            {
              label: "Payback Simples",
              value: pb !== null ? `${pb.toFixed(2)} anos` : `> ${v} anos`,
              color: "text-blue-600",
              bg:    "bg-blue-50",
              icon: Clock,
              sub: pb !== null && pb <= v ? "Dentro da vigência" : "Fora da vigência",
            },
            {
              label: "Índice de Lucratividade",
              value: ilV !== null ? ilV.toFixed(2) : "N/D",
              color: (ilV ?? 0) >= 1 ? "text-emerald-600" : "text-red-500",
              bg:    (ilV ?? 0) >= 1 ? "bg-emerald-50"   : "bg-red-50",
              icon: DollarSign,
              sub: (ilV ?? 0) >= 1 ? "Projeto viável" : "Projeto inviável",
            },
          ].map(k => (
            <div key={k.label} className="glass-card p-5">
              <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center mb-3", k.bg)}>
                <k.icon size={16} className={k.color} />
              </div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{k.label}</p>
              <p className={cn("text-xl font-bold font-outfit mt-0.5", k.color)}>{k.value}</p>
              <p className="text-[10px] text-slate-400 mt-1">{k.sub}</p>
            </div>
          ))}
        </div>

        {/* Tabela DRE + FCFF */}
        <div className="glass-card overflow-x-auto">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-700">Projeção Financeira — DRE + FCFF</h2>
          </div>
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200">
                <th className="px-5 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider w-52">Linha</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-500 uppercase">Ano 0</th>
                {projecoes.map(a => (
                  <th key={a.ano} className="px-4 py-3 text-right text-[10px] font-bold text-slate-500 uppercase">
                    Ano {a.ano}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* CAPEX row */}
              <tr className="border-b border-slate-100 bg-red-50/30">
                <td className="px-5 py-2 text-xs font-bold text-slate-700">Imobilizado (CAPEX)</td>
                <td className="px-4 py-2 text-right text-xs font-bold text-red-500 tabular-nums">
                  ({formatCurrency(c).replace("R$","").trim()})
                </td>
                {projecoes.map(a => (
                  <td key={a.ano} className="px-4 py-2 text-right text-xs text-slate-300 tabular-nums">—</td>
                ))}
              </tr>
              {DRE_LINHAS.map(linha => (
                <tr
                  key={linha.key}
                  className={cn(
                    "border-b border-slate-100",
                    linha.hl ? "bg-unifique-primary/5" : "hover:bg-slate-50/50",
                    linha.border ? "border-t-2 border-t-slate-300" : ""
                  )}
                >
                  <td className={cn(
                    "px-5 py-2 text-xs",
                    linha.bold ? "font-bold text-slate-800" : "text-slate-500 pl-8"
                  )}>
                    {linha.label}
                  </td>
                  <td className="px-4 py-2 text-right text-xs text-slate-300 tabular-nums">—</td>
                  {projecoes.map(a => {
                    const val = (a as unknown as Record<string, number>)[linha.key] ?? 0;
                    const neg = val < 0;
                    const display = neg
                      ? `(${formatCurrency(Math.abs(val)).replace("R$", "").trim()})`
                      : formatCurrency(val);
                    return (
                      <td
                        key={a.ano}
                        className={cn(
                          "px-4 py-2 text-right tabular-nums text-xs",
                          linha.bold ? "font-bold" : "",
                          neg ? "text-red-500" : linha.hl ? "text-unifique-primary" : "text-slate-700"
                        )}
                      >
                        {display}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Referência fiscal */}
        <div className="glass-card p-5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Parâmetros Fiscais Utilizados</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            {[
              { l: "ISS",                      v: "3,00%" },
              { l: "PIS/COFINS",               v: "9,25%" },
              { l: "Total impostos s/ venda",  v: "12,25%" },
              { l: "IR/CSLL (lucro real)",      v: "34,00%" },
              { l: "Desp. comerciais — Ano 1",  v: "1,75%" },
              { l: "Desp. comerciais — Demais", v: "1,00%" },
              { l: "Crédito PIS/COFINS compra", v: "2,775% do custo" },
              { l: "Depreciação",               v: `Linear ${v} anos` },
            ].map(t => (
              <div key={t.l} className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">{t.l}</span>
                <span className="font-bold text-slate-700">{t.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  );
}
