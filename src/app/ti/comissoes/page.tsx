"use client";

import { useState, useEffect } from "react";
import { Shell } from "@/components/layout/Shell";
import { supabase } from "@/lib/supabase";
import { formatCurrency, cn } from "@/lib/utils";
import { DollarSign, TrendingUp, Users, Loader2, Building2 } from "lucide-react";

interface NegocioGanho {
  id: string;
  nome: string;
  empresa: string;
  valor: number;
  vigencia_meses: number;
  responsavel: string;
  especialista: string;
}

const TAXA_COMISSAO_CONSULTOR  = 0.03;  // 3%
const TAXA_COMISSAO_ESPECIALISTA = 0.015; // 1,5%

export default function ComissoesPage() {
  const [negocios, setNegocios] = useState<NegocioGanho[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("negocios")
      .select("id, nome, valor, vigencia_meses, responsavel, especialista, empresas(nome)")
      .eq("fase", "Ganho")
      .order("valor", { ascending: false })
      .then(({ data }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rows: NegocioGanho[] = (data ?? []).map((n: any) => {
          const emp = Array.isArray(n.empresas) ? n.empresas[0] : n.empresas;
          return {
            id: n.id,
            nome: n.nome,
            empresa: emp?.nome ?? "—",
            valor: n.valor ?? 0,
            vigencia_meses: n.vigencia_meses ?? 0,
            responsavel: n.responsavel ?? "—",
            especialista: n.especialista ?? "—",
          };
        });
        setNegocios(rows);
        setLoading(false);
      });
  }, []);

  const rows = negocios.map(n => {
    const receitaTotal = n.valor * (n.vigencia_meses > 0 ? n.vigencia_meses : 12);
    const comissaoConsultor   = receitaTotal * TAXA_COMISSAO_CONSULTOR;
    const comissaoEspecialista = receitaTotal * TAXA_COMISSAO_ESPECIALISTA;
    return { ...n, receitaTotal, comissaoConsultor, comissaoEspecialista };
  });

  const totalReceita    = rows.reduce((s, r) => s + r.receitaTotal, 0);
  const totalConsultor  = rows.reduce((s, r) => s + r.comissaoConsultor, 0);
  const totalEspecialista = rows.reduce((s, r) => s + r.comissaoEspecialista, 0);

  return (
    <Shell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-outfit text-slate-900">Comissões</h1>
          <p className="text-sm text-slate-500">Comissões calculadas sobre contratos Ganhos — Consultor 3% · Especialista 1,5% sobre Receita Total do Contrato.</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Receita Total (Contratos Ganhos)", value: totalReceita, icon: TrendingUp, color: "text-unifique-primary", bg: "bg-unifique-primary/10" },
            { label: "Total Comissão Consultores (3%)",  value: totalConsultor,   icon: Users,      color: "text-emerald-600",      bg: "bg-emerald-50"          },
            { label: "Total Comissão Especialistas (1,5%)", value: totalEspecialista, icon: DollarSign, color: "text-blue-600", bg: "bg-blue-50" },
          ].map(k => (
            <div key={k.label} className="glass-card p-5 flex items-center gap-4">
              <div className={cn("p-3 rounded-xl flex-shrink-0", k.bg)}>
                <k.icon size={20} className={k.color} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">{k.label}</p>
                <p className={cn("text-xl font-bold font-outfit", k.color)}>{formatCurrency(k.value)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabela */}
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-700">Detalhamento por Negócio</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Base: Valor/mês × Vigência (meses) × taxa de comissão</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[900px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200">
                  {["Negócio", "Empresa", "Consultor", "Especialista", "Valor/mês", "Vigência", "Receita Total", "Com. Consultor (3%)", "Com. Especialista (1,5%)"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={9} className="p-12 text-center text-slate-400">
                    <Loader2 className="animate-spin mx-auto mb-2" size={20} />Carregando...
                  </td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={9} className="p-12 text-center text-slate-400 text-sm">Nenhum negócio Ganho encontrado.</td></tr>
                ) : rows.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-all text-sm">
                    <td className="px-4 py-3 font-bold text-slate-800 max-w-[160px] truncate">{r.nome}</td>
                    <td className="px-4 py-3 text-slate-500">
                      <div className="flex items-center gap-1"><Building2 size={10} />{r.empresa}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{r.responsavel}</td>
                    <td className="px-4 py-3 text-slate-600">{r.especialista !== "—" ? r.especialista : <span className="text-slate-300">—</span>}</td>
                    <td className="px-4 py-3 font-medium text-unifique-primary tabular-nums">{formatCurrency(r.valor)}</td>
                    <td className="px-4 py-3 text-slate-500 tabular-nums">{r.vigencia_meses > 0 ? `${r.vigencia_meses}m` : "12m"}</td>
                    <td className="px-4 py-3 font-bold text-slate-700 tabular-nums">{formatCurrency(r.receitaTotal)}</td>
                    <td className="px-4 py-3 font-bold text-emerald-600 tabular-nums">{formatCurrency(r.comissaoConsultor)}</td>
                    <td className="px-4 py-3 font-bold text-blue-600 tabular-nums">{formatCurrency(r.comissaoEspecialista)}</td>
                  </tr>
                ))}
                {rows.length > 0 && (
                  <tr className="bg-slate-50 font-bold border-t-2 border-slate-300 text-sm">
                    <td className="px-4 py-3 text-slate-700" colSpan={4}>TOTAL</td>
                    <td className="px-4 py-3 tabular-nums text-unifique-primary">{formatCurrency(negocios.reduce((s,n)=>s+n.valor,0))}</td>
                    <td className="px-4 py-3 text-slate-400">—</td>
                    <td className="px-4 py-3 tabular-nums text-slate-700">{formatCurrency(totalReceita)}</td>
                    <td className="px-4 py-3 tabular-nums text-emerald-600">{formatCurrency(totalConsultor)}</td>
                    <td className="px-4 py-3 tabular-nums text-blue-600">{formatCurrency(totalEspecialista)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Shell>
  );
}
