"use client";

import { useState, useEffect } from "react";
import { Shell } from "@/components/layout/Shell";
import { supabase } from "@/lib/supabase";
import { formatCurrency, cn } from "@/lib/utils";
import type { Negocio } from "@/types";
import {
  FolderOpen,
  Loader2,
  Building2,
  DollarSign,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";

const FASES_PROJETO = [
  { id: "Compras",     color: "bg-amber-400",   border: "border-amber-200",  label_bg: "bg-amber-50 text-amber-700"  },
  { id: "Implantação", color: "bg-blue-500",    border: "border-blue-200",   label_bg: "bg-blue-50 text-blue-700"   },
  { id: "Concluído",   color: "bg-emerald-500", border: "border-emerald-200",label_bg: "bg-emerald-50 text-emerald-700"},
  { id: "Pós Vendas",  color: "bg-purple-500",  border: "border-purple-200", label_bg: "bg-purple-50 text-purple-700"},
] as const;

type FaseProjeto = (typeof FASES_PROJETO)[number]["id"];

interface Cartao {
  id: string;
  nome: string;
  empresa: string;
  valor: number;
  contrato_global: number;
  produtos: string[];
  projeto_fase: FaseProjeto;
  vigencia_meses: number;
}

function buildCartao(n: Negocio): Cartao {
  const valor = n.valor ?? 0;
  const vigencia = n.vigencia_meses ?? 0;
  return {
    id: n.id,
    nome: n.nome,
    empresa: n.empresas?.nome ?? "—",
    valor,
    contrato_global: valor * vigencia,
    produtos: Array.isArray(n.produtos) ? n.produtos : [],
    projeto_fase: (n.projeto_fase as FaseProjeto) || "Compras",
    vigencia_meses: vigencia,
  };
}

export default function ProjetosPage() {
  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  const [loading, setLoading] = useState(true);
  const [movendo, setMovendo] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("negocios")
      .select("*, empresas(nome)")
      .eq("fase", "Ganho")
      .order("valor", { ascending: false });
    setCartoes(((data as Negocio[]) ?? []).map(buildCartao));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function moverFase(id: string, novaFase: FaseProjeto) {
    setMovendo(id);
    await supabase.from("negocios").update({ projeto_fase: novaFase }).eq("id", id);
    setCartoes(prev => prev.map(c => c.id === id ? { ...c, projeto_fase: novaFase } : c));
    setMovendo(null);
  }

  function proximaFase(atual: FaseProjeto): FaseProjeto | null {
    const idx = FASES_PROJETO.findIndex(f => f.id === atual);
    return idx < FASES_PROJETO.length - 1 ? FASES_PROJETO[idx + 1].id : null;
  }

  const totalValor = cartoes.reduce((s, c) => s + c.valor, 0);
  const totalContrato = cartoes.reduce((s, c) => s + c.contrato_global, 0);

  return (
    <Shell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-outfit text-slate-900">Projetos</h1>
            <p className="text-sm text-slate-500">Pipeline de implantação — negócios ganhos.</p>
          </div>
          <div className="flex gap-4">
            <div className="glass-card px-4 py-2 flex items-center gap-2">
              <DollarSign size={14} className="text-unifique-primary" />
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Receita Mensal</p>
                <p className="text-sm font-bold text-unifique-primary">{formatCurrency(totalValor)}</p>
              </div>
            </div>
            {totalContrato > 0 && (
              <div className="glass-card px-4 py-2 flex items-center gap-2">
                <FolderOpen size={14} className="text-purple-600" />
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Contrato Global</p>
                  <p className="text-sm font-bold text-purple-600">{formatCurrency(totalContrato)}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <Loader2 size={28} className="animate-spin" />
          </div>
        ) : cartoes.length === 0 ? (
          <div className="glass-card flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
            <FolderOpen size={40} />
            <p className="text-sm font-medium">Nenhum negócio ganho ainda.</p>
            <p className="text-xs text-slate-400 max-w-xs text-center">
              Quando um negócio do pipeline for marcado como "Ganho", ele aparecerá aqui para acompanhamento da implantação.
            </p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 min-h-[500px]">
            {FASES_PROJETO.map((fase) => {
              const itens = cartoes.filter(c => c.projeto_fase === fase.id);
              const totalFase = itens.reduce((s, c) => s + c.valor, 0);
              return (
                <div key={fase.id} className="flex-shrink-0 w-72 flex flex-col gap-3">
                  {/* Column header */}
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2.5 h-2.5 rounded-full", fase.color)} />
                      <h2 className="font-bold text-xs text-slate-700 uppercase tracking-wider">{fase.id}</h2>
                      <span className="bg-slate-200 text-[10px] font-bold px-2 py-0.5 rounded-full text-slate-500">{itens.length}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">{formatCurrency(totalFase)}</span>
                  </div>

                  {/* Column body */}
                  <div className={cn(
                    "flex-1 space-y-3 p-2 rounded-2xl border border-dashed min-h-[200px]",
                    fase.border,
                    "bg-slate-50/50"
                  )}>
                    {itens.length === 0 && (
                      <div className="h-20 flex items-center justify-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vazio</p>
                      </div>
                    )}
                    {itens.map((c, idx) => {
                      const prox = proximaFase(c.projeto_fase);
                      return (
                        <motion.div
                          key={c.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.04 }}
                          className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md hover:border-unifique-primary/40 transition-all"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                              <Building2 size={10} />
                              <span className="truncate max-w-[140px]">{c.empresa}</span>
                            </div>
                            <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded", fase.label_bg)}>{fase.id}</span>
                          </div>

                          <h3 className="font-bold text-sm text-slate-900 mb-2 leading-snug">{c.nome}</h3>

                          {c.produtos.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {c.produtos.slice(0, 2).map(p => (
                                <span key={p} className="text-[9px] font-bold px-1.5 py-0.5 bg-unifique-primary/10 text-unifique-primary rounded">{p}</span>
                              ))}
                              {c.produtos.length > 2 && (
                                <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded">+{c.produtos.length - 2}</span>
                              )}
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                            <div>
                              <p className="text-[10px] text-slate-400">Valor/mês</p>
                              <p className="text-xs font-bold text-slate-800">{formatCurrency(c.valor)}</p>
                            </div>
                            {c.contrato_global > 0 && (
                              <div className="text-right">
                                <p className="text-[10px] text-slate-400">Contrato global</p>
                                <p className="text-xs font-bold text-purple-600">{formatCurrency(c.contrato_global)}</p>
                              </div>
                            )}
                          </div>

                          {prox && (
                            <button
                              onClick={() => moverFase(c.id, prox)}
                              disabled={movendo === c.id}
                              className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-dashed border-slate-200 text-[11px] font-bold text-slate-400 hover:border-unifique-primary hover:text-unifique-primary transition-all disabled:opacity-50"
                            >
                              {movendo === c.id
                                ? <Loader2 size={12} className="animate-spin" />
                                : <ArrowRight size={12} />}
                              Mover para {prox}
                            </button>
                          )}
                          {!prox && (
                            <div className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-600">
                              <ChevronRight size={12} />
                              Pós Vendas completo
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Shell>
  );
}
