"use client";

import { useEffect, useState, useMemo } from "react";
import { Shell } from "@/components/layout/Shell";
import { supabase } from "@/lib/supabase";
import { formatCurrency, cn } from "@/lib/utils";
import { FileBarChart, TrendingUp, Package, DollarSign, Download, Building2, Loader2 } from "lucide-react";

const ISS_COFINS    = 0.1225;
const CREDITO_COMPRA = 0.02775;

const MESES_PT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

interface NegocioGanho {
  id: string;
  nome: string;
  empresa: string;
  valor: number;
  vigencia_meses: number;
  custo_oportunidade: number;
  updated_at: string;
  produtos: string[];
}

function mesKey(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function RelatoriosPage() {
  const [negocios, setNegocios] = useState<NegocioGanho[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("negocios")
      .select("id, nome, valor, vigencia_meses, custo_oportunidade, updated_at, produtos, empresas(nome)")
      .eq("fase", "Ganho")
      .order("updated_at", { ascending: false })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then(({ data }) => {
        const rows: NegocioGanho[] = (data ?? []).map((n: any) => {
          const emp = Array.isArray(n.empresas) ? n.empresas[0] : n.empresas;
          return {
            id: n.id,
            nome: n.nome,
            empresa: emp?.nome ?? "—",
            valor: n.valor ?? 0,
            vigencia_meses: n.vigencia_meses ?? 0,
            custo_oportunidade: n.custo_oportunidade ?? 0,
            updated_at: n.updated_at ?? "",
            produtos: Array.isArray(n.produtos) ? n.produtos : [],
          };
        });
        setNegocios(rows);
        setLoading(false);
      });
  }, []);

  // Receita total e ROL
  const receitaTotal = negocios.reduce((s, n) => s + n.valor, 0);
  const rolTotal     = receitaTotal * (1 - ISS_COFINS);

  // Agrupamento mensal (últimos 6 meses com dados ou os 6 meses mais recentes)
  const dadosMensais = useMemo(() => {
    const mapa: Record<string, { receita: number; rol: number }> = {};
    negocios.forEach(n => {
      const k = mesKey(n.updated_at);
      if (!mapa[k]) mapa[k] = { receita: 0, rol: 0 };
      mapa[k].receita += n.valor;
      mapa[k].rol     += n.valor * (1 - ISS_COFINS);
    });

    // pegar os últimos 6 meses com dados, ordenados
    const keys = Object.keys(mapa).sort().slice(-6);
    if (keys.length === 0) return [];
    return keys.map(k => {
      const [ano, mes] = k.split("-");
      return {
        label: `${MESES_PT[parseInt(mes) - 1]}/${ano.slice(2)}`,
        receita: mapa[k].receita,
        rol: mapa[k].rol,
      };
    });
  }, [negocios]);

  const maxBar = Math.max(...dadosMensais.map(d => d.receita), 1);

  // Mix de produtos
  const produtosMix = useMemo(() => {
    const cnt: Record<string, number> = {};
    negocios.forEach(n => n.produtos.forEach(p => { cnt[p] = (cnt[p] ?? 0) + 1; }));
    const total = Object.values(cnt).reduce((s, v) => s + v, 0) || 1;
    return Object.entries(cnt)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([nome, qtd]) => ({ nome, qtd, pct: Math.round((qtd / total) * 100) }));
  }, [negocios]);

  const CORES = ["#0057B8", "#00C8F0", "#1D9E75", "#D97706", "#7C3AED"];

  // Tabela de deals com fórmulas BU Cyber
  const rows = negocios.map(n => {
    const rb  = n.valor * (n.vigencia_meses > 0 ? n.vigencia_meses : 12);
    const imp = rb * ISS_COFINS;
    const rl  = rb - imp;
    const cred = n.custo_oportunidade * CREDITO_COMPRA;
    return { ...n, rb, imp, rl, cred };
  });
  const totRb   = rows.reduce((s, r) => s + r.rb,   0);
  const totImp  = rows.reduce((s, r) => s + r.imp,  0);
  const totRl   = rows.reduce((s, r) => s + r.rl,   0);
  const totCred = rows.reduce((s, r) => s + r.cred, 0);

  return (
    <Shell>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-outfit">Relatórios TI</h1>
            <p className="text-slate-500 mt-1">
              Análise financeira consolidada — contratos Ganhos · {new Date().getFullYear()}
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-unifique-primary text-white rounded-xl text-sm font-bold hover:scale-[1.02] transition-all shadow-lg shadow-unifique-primary/25"
          >
            <Download size={16} /> Exportar PDF
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-400">
            <Loader2 className="animate-spin mr-3" size={24} /> Carregando dados...
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: "Receita Acumulada (Ganhos)", value: formatCurrency(receitaTotal), icon: TrendingUp, color: "text-unifique-primary", bg: "bg-unifique-primary/10" },
                { label: "ROL (após 12,25% tributos)", value: formatCurrency(rolTotal),     icon: DollarSign,  color: "text-emerald-600",     bg: "bg-emerald-50"          },
                { label: "Margem ROL",    value: `${Math.round((1 - ISS_COFINS) * 100)}%`,  icon: FileBarChart, color: "text-blue-600",        bg: "bg-blue-50"             },
                { label: "Contratos Ganhos", value: String(negocios.length),                icon: Package,      color: "text-purple-600",      bg: "bg-purple-50"           },
              ].map(k => (
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

            {/* Gráfico mensal + Mix produtos */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Bar chart mensal */}
              <div className="lg:col-span-2 glass-card p-6">
                <h3 className="font-bold text-sm mb-6 text-slate-700">
                  Receita Mensal (Ganhos) — Receita Bruta vs ROL
                </h3>
                {dadosMensais.length === 0 ? (
                  <div className="flex items-center justify-center h-44 text-slate-400 text-sm">
                    Nenhum negócio Ganho encontrado.
                  </div>
                ) : (
                  <>
                    <div className="flex items-end gap-4 h-44">
                      {dadosMensais.map(d => {
                        const hR = (d.receita / maxBar) * 100;
                        const hL = (d.rol / maxBar) * 100;
                        return (
                          <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
                            <div className="w-full flex items-end gap-1 h-40">
                              <div
                                className="flex-1 rounded-t-md bg-unifique-primary hover:brightness-110 transition-all cursor-pointer"
                                style={{ height: `${hR}%` }}
                                title={`Receita: ${formatCurrency(d.receita)}`}
                              />
                              <div
                                className="flex-1 rounded-t-md bg-emerald-400 hover:brightness-110 transition-all cursor-pointer"
                                style={{ height: `${hL}%` }}
                                title={`ROL: ${formatCurrency(d.rol)}`}
                              />
                            </div>
                            <p className="text-[10px] font-bold text-slate-400">{d.label}</p>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-6 mt-4 justify-center">
                      {[
                        { label: "Receita Bruta", color: "bg-unifique-primary" },
                        { label: "ROL (87,75%)",  color: "bg-emerald-400"      },
                      ].map(l => (
                        <div key={l.label} className="flex items-center gap-2 text-xs text-slate-500">
                          <span className={cn("w-3 h-3 rounded-sm", l.color)} />
                          {l.label}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Mix de produtos */}
              <div className="glass-card p-6">
                <h3 className="font-bold text-sm mb-6 text-slate-700">Mix de Produtos (Top 5)</h3>
                {produtosMix.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">Sem dados de produtos.</p>
                ) : (
                  <div className="space-y-4">
                    {produtosMix.map((p, i) => (
                      <div key={p.nome}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CORES[i] }} />
                            <span className="text-xs font-medium text-slate-700 truncate">{p.nome}</span>
                          </div>
                          <span className="text-xs font-bold text-slate-600 ml-2">{p.pct}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${p.pct}%`, backgroundColor: CORES[i] }} />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">{p.qtd} contrato{p.qtd > 1 ? "s" : ""}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Tabela — fórmulas BU Cyber */}
            {rows.length > 0 && (
              <div className="glass-card overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h3 className="font-bold text-sm text-slate-700">Faturamento por Contrato — Cálculo BU Cyber</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Receita Bruta Total = Valor/mês × Vigência · ISS 3% + PIS/COFINS 9,25% = 12,25%
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs min-w-[820px]">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200">
                        {["Negócio","Empresa","Valor/mês","Vigência","Receita Bruta Total","Imposto (12,25%)","Receita Líquida","Crédito Compra"].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rows.map(r => (
                        <tr key={r.id} className="hover:bg-slate-50 transition-all">
                          <td className="px-4 py-3 font-bold text-slate-800 max-w-[180px] truncate">{r.nome}</td>
                          <td className="px-4 py-3 text-slate-500">
                            <div className="flex items-center gap-1"><Building2 size={10} />{r.empresa}</div>
                          </td>
                          <td className="px-4 py-3 font-medium text-unifique-primary tabular-nums">{formatCurrency(r.valor)}</td>
                          <td className="px-4 py-3 text-slate-500 tabular-nums">{r.vigencia_meses > 0 ? `${r.vigencia_meses}m` : "12m"}</td>
                          <td className="px-4 py-3 font-bold text-slate-700 tabular-nums">{formatCurrency(r.rb)}</td>
                          <td className="px-4 py-3 text-red-500 tabular-nums">({formatCurrency(r.imp).replace("R$","").trim()})</td>
                          <td className="px-4 py-3 font-bold text-emerald-600 tabular-nums">{formatCurrency(r.rl)}</td>
                          <td className="px-4 py-3 text-blue-600 tabular-nums">{r.cred > 0 ? formatCurrency(r.cred) : "—"}</td>
                        </tr>
                      ))}
                      <tr className="bg-slate-50 font-bold border-t-2 border-slate-300">
                        <td className="px-4 py-3 text-slate-700">TOTAL</td>
                        <td className="px-4 py-3 text-slate-400">—</td>
                        <td className="px-4 py-3 text-unifique-primary tabular-nums">{formatCurrency(negocios.reduce((s,n)=>s+n.valor,0))}</td>
                        <td className="px-4 py-3 text-slate-400">—</td>
                        <td className="px-4 py-3 text-slate-700 tabular-nums">{formatCurrency(totRb)}</td>
                        <td className="px-4 py-3 text-red-500 tabular-nums">({formatCurrency(totImp).replace("R$","").trim()})</td>
                        <td className="px-4 py-3 text-emerald-600 tabular-nums">{formatCurrency(totRl)}</td>
                        <td className="px-4 py-3 text-blue-600 tabular-nums">{totCred > 0 ? formatCurrency(totCred) : "—"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {rows.length === 0 && (
              <div className="glass-card p-12 text-center text-slate-400">
                <Package className="mx-auto mb-3 opacity-40" size={36} />
                <p className="font-medium">Nenhum negócio na fase Ganho ainda.</p>
                <p className="text-sm mt-1">Mova deals para Ganho no Pipeline para ver os dados aqui.</p>
              </div>
            )}
          </>
        )}
      </div>
    </Shell>
  );
}
