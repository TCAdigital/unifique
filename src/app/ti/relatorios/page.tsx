"use client";

import { Shell } from "@/components/layout/Shell";
import { formatCurrency, cn } from "@/lib/utils";
import { FileBarChart, TrendingUp, Package, DollarSign, Users, Download } from "lucide-react";

const DADOS_MENSAIS = [
  { mes: "Jan", receita: 380000, custo: 210000, lucro: 170000 },
  { mes: "Fev", receita: 420000, custo: 225000, lucro: 195000 },
  { mes: "Mar", receita: 395000, custo: 218000, lucro: 177000 },
  { mes: "Abr", receita: 465000, custo: 240000, lucro: 225000 },
];

const PRODUTOS = [
  { nome: "Hardware (Servidores, Switches, APs)", participacao: 42, receita: 843600, margem: 28 },
  { nome: "Software (Licenças Microsoft, VMware)", participacao: 28, receita: 562400, margem: 65 },
  { nome: "Serviços Gerenciados", participacao: 20, receita: 401400, margem: 72 },
  { nome: "Infraestrutura (Cabeamento, Rack)", participacao: 10, receita: 200700, margem: 35 },
];

const CORES_PRODUTO = ["#0057B8", "#00C8F0", "#1D9E75", "#D97706"];

const totalReceita = DADOS_MENSAIS.reduce((s, m) => s + m.receita, 0);
const totalLucro = DADOS_MENSAIS.reduce((s, m) => s + m.lucro, 0);
const margemMedia = Math.round((totalLucro / totalReceita) * 100);

const maxReceita = Math.max(...DADOS_MENSAIS.map((d) => d.receita));

export default function RelatoriosPage() {
  return (
    <Shell>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-outfit">
              Relatórios TI
            </h1>
            <p className="text-slate-500 mt-1">
              Análise financeira consolidada — Backoffice de Tecnologia · Acumulado 2026
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-unifique-primary text-white rounded-xl text-sm font-bold hover:scale-[1.02] transition-all shadow-lg shadow-unifique-primary/25">
            <Download size={16} /> Exportar PDF
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Receita Acumulada", value: formatCurrency(totalReceita), icon: TrendingUp, color: "text-unifique-primary", bg: "bg-unifique-primary/10" },
            { label: "Lucro Acumulado", value: formatCurrency(totalLucro), icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
            { label: "Margem Média", value: `${margemMedia}%`, icon: FileBarChart, color: margemMedia >= 40 ? "text-emerald-600" : "text-amber-600", bg: "bg-slate-50 dark:bg-slate-800" },
            { label: "Projetos Ativos", value: "12", icon: Package, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
          ].map((k) => (
            <div key={k.label} className="glass-card p-5 flex items-center gap-4">
              <div className={cn("p-3 rounded-xl flex-shrink-0", k.bg)}>
                <k.icon size={20} className={k.color} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">{k.label}</p>
                <p className={cn("text-xl font-bold font-outfit truncate", k.color)}>{k.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bar Chart */}
        <div className="glass-card p-6">
          <h3 className="font-bold text-sm mb-6 text-slate-700 dark:text-slate-200">
            Receita vs Custo vs Lucro — Mensal 2026
          </h3>
          <div className="flex items-end gap-6 h-52">
            {DADOS_MENSAIS.map((d) => {
              const hR = (d.receita / maxReceita) * 100;
              const hC = (d.custo / maxReceita) * 100;
              const hL = (d.lucro / maxReceita) * 100;
              return (
                <div key={d.mes} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end gap-1 h-44">
                    <div className="flex-1 rounded-t-md bg-unifique-primary transition-all hover:brightness-110 cursor-pointer" style={{ height: `${hR}%` }} title={`Receita: ${formatCurrency(d.receita)}`} />
                    <div className="flex-1 rounded-t-md bg-red-400 dark:bg-red-500/70 transition-all hover:brightness-110 cursor-pointer" style={{ height: `${hC}%` }} title={`Custo: ${formatCurrency(d.custo)}`} />
                    <div className="flex-1 rounded-t-md bg-unifique-success transition-all hover:brightness-110 cursor-pointer" style={{ height: `${hL}%` }} title={`Lucro: ${formatCurrency(d.lucro)}`} />
                  </div>
                  <p className="text-xs font-bold text-slate-500">{d.mes}</p>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-6 mt-4 justify-center">
            {[
              { label: "Receita", color: "bg-unifique-primary" },
              { label: "Custo", color: "bg-red-400" },
              { label: "Lucro", color: "bg-unifique-success" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-2 text-xs text-slate-500">
                <span className={cn("w-3 h-3 rounded-sm", l.color)} />
                {l.label}
              </div>
            ))}
          </div>
        </div>

        {/* Mix de produtos */}
        <div className="glass-card p-6">
          <h3 className="font-bold text-sm mb-6 text-slate-700 dark:text-slate-200">
            Mix de Produtos — Participação na Receita
          </h3>
          <div className="space-y-4">
            {PRODUTOS.map((p, i) => (
              <div key={p.nome}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CORES_PRODUTO[i] }} />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{p.nome}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{formatCurrency(p.receita)}</span>
                    <span className="text-[10px] text-slate-400 ml-2">Margem: {p.margem}%</span>
                  </div>
                </div>
                <div className="w-full h-2.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${p.participacao}%`, backgroundColor: CORES_PRODUTO[i] }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">{p.participacao}% da receita total</p>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly detail table */}
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5">
            <h3 className="font-bold text-sm">Detalhamento Mensal</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/5">
                  {["Mês", "Receita Bruta", "Custo Total", "Lucro Líquido", "Margem"].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {DADOS_MENSAIS.map((d) => {
                  const margem = Math.round((d.lucro / d.receita) * 100);
                  return (
                    <tr key={d.mes} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                      <td className="px-6 py-3 font-bold text-slate-700 dark:text-slate-200">{d.mes}/2026</td>
                      <td className="px-6 py-3 font-medium text-unifique-primary">{formatCurrency(d.receita)}</td>
                      <td className="px-6 py-3 font-medium text-red-500">{formatCurrency(d.custo)}</td>
                      <td className="px-6 py-3 font-bold text-emerald-600">{formatCurrency(d.lucro)}</td>
                      <td className="px-6 py-3">
                        <span className={cn(
                          "font-bold text-xs px-2 py-1 rounded",
                          margem >= 40 ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" : "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                        )}>
                          {margem}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-slate-50 dark:bg-white/5 font-bold">
                  <td className="px-6 py-3 text-slate-700 dark:text-slate-200">TOTAL</td>
                  <td className="px-6 py-3 text-unifique-primary">{formatCurrency(totalReceita)}</td>
                  <td className="px-6 py-3 text-red-500">{formatCurrency(DADOS_MENSAIS.reduce((s, m) => s + m.custo, 0))}</td>
                  <td className="px-6 py-3 text-emerald-600">{formatCurrency(totalLucro)}</td>
                  <td className="px-6 py-3">
                    <span className="font-bold text-xs px-2 py-1 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                      {margemMedia}%
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Shell>
  );
}
