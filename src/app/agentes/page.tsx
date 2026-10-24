"use client";

import React, { useEffect, useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import {
  CADENCIA_SDR,
  GANCHOS_PLAYBOOK,
  emailProspeccao,
  mensagemFollowUp,
  mensagemWhatsAppProspeccao,
  linkEmail,
  linkWhatsApp,
  pendenciasContato,
} from '@/lib/cadencia-sdr';
import {
  Cpu,
  Search,
  Activity,
  Zap,
  ShieldCheck,
  MessageSquare,
  Target,
  RefreshCw,
  Mail,
  Phone,
  Building2,
  ChevronDown,
  Copy,
  Check,
  AlertCircle,
  ArrowRight,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface EmpresaLead {
  id: string;
  nome: string;
  segmento: string | null;
  status: string | null;
  contato: string | null;
  email_contato: string | null;
  tel: string | null;
}

const AGENTES = [
  { id: "sdr", nome: "SDR-AI Outbound", icon: Zap, cor: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20", grupo: "Prospecção" },
  { id: "icp", nome: "ICP Scorer AI", icon: Target, cor: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20", grupo: "Triagem" },
  { id: "bant", nome: "BANT Qualifier", icon: Search, cor: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", grupo: "Qualificação" },
  { id: "health", nome: "Deal Health AI", icon: Activity, cor: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20", grupo: "Pipeline" },
];

const FALLBACK_MSGS = [
  "Monitorando estagnação no pipeline",
  "Calculando score ICP de novo lead",
  "Qualificando lead via WhatsApp",
  "Gerando sequência de follow-up",
  "Detectando sinal de urgência em negócio",
  "Enviando follow-up automático",
];

export default function AgentesPage() {
  const [logs, setLogs] = useState<{ id: number; ts: string; ag: string; msg: string }[]>([]);
  const [pulso, setPulso] = useState(false);
  const [tarefasMsgs, setTarefasMsgs] = useState<string[]>(FALLBACK_MSGS);
  const [totalTarefas, setTotalTarefas] = useState('—');
  const [followUps, setFollowUps] = useState('—');

  const { user } = useAuth();
  const [leads, setLeads] = useState<EmpresaLead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [leadAberto, setLeadAberto] = useState<string | null>(null);
  const [etapaPorLead, setEtapaPorLead] = useState<Record<string, number>>({});
  const [copiado, setCopiado] = useState<string | null>(null);
  const [convertendo, setConvertendo] = useState<string | null>(null);
  const [erroConversao, setErroConversao] = useState<string | null>(null);

  // Fila de prospecção do Agente SDR: contas com status Lead
  useEffect(() => {
    supabase
      .from('empresas')
      .select('id, nome, segmento, status, contato, email_contato, tel')
      .eq('status', 'Lead')
      .order('nome')
      .then(({ data }) => {
        setLeads((data ?? []) as EmpresaLead[]);
        setLeadsLoading(false);
      });
  }, []);

  function paraLead(lead: EmpresaLead) {
    return { empresa: lead.nome, contato: lead.contato, email: lead.email_contato, tel: lead.tel };
  }

  function textoEtapa(lead: EmpresaLead, dia: number): string {
    const base = paraLead(lead);
    if (dia === 0) return mensagemWhatsAppProspeccao(base, user?.nome);
    return mensagemFollowUp(dia, base);
  }

  async function copiar(leadId: string, texto: string) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(leadId);
      setTimeout(() => setCopiado(null), 2000);
    } catch {
      /* clipboard indisponível no navegador */
    }
  }

  const leadsProntos = leads.filter((l) => pendenciasContato(paraLead(l)).length === 0).length;
  const leadsPendentes = leads.length - leadsProntos;

  // Converte o lead em Negociando/Ativo — a conta sai da fila SDR e passa a
  // ser acompanhada no Diagnóstico da Agenda do Dia.
  async function converterStatus(lead: EmpresaLead, novo: 'Negociando' | 'Ativo') {
    setConvertendo(lead.id);
    setErroConversao(null);
    try {
      const res = await fetch('/api/empresas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: lead.id, payload: { status: novo } }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error ?? 'Falha ao atualizar o status');
      }
      setLeads((prev) => prev.filter((l) => l.id !== lead.id));
      setLeadAberto(null);
    } catch (e) {
      setErroConversao(e instanceof Error ? e.message : 'Falha ao atualizar o status');
    } finally {
      setConvertendo(null);
    }
  }

  useEffect(() => {
    supabase
      .from('tarefas')
      .select('titulo, tipo, status')
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setTarefasMsgs(data.map(t => `[${t.tipo}] ${t.titulo}`));
          setTotalTarefas(String(data.length));
          setFollowUps(String(data.filter(t => t.tipo === 'Call' || t.tipo === 'WhatsApp').length));
        }
      });
  }, []);

  useEffect(() => {
    const iv = setInterval(() => {
      const ag = AGENTES[Math.floor(Math.random() * AGENTES.length)];
      const msg = tarefasMsgs[Math.floor(Math.random() * tarefasMsgs.length)];
      const newLog = {
        id: Date.now(),
        ts: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        ag: ag.nome,
        msg,
      };
      setLogs(l => [newLog, ...l].slice(0, 8));
      setPulso(true);
      setTimeout(() => setPulso(false), 1000);
    }, 3000);
    return () => clearInterval(iv);
  }, [tarefasMsgs]);

  return (
    <Shell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-unifique-primary/10 flex items-center justify-center text-unifique-primary">
              <Cpu size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-outfit text-slate-900">Agentes de IA ao Vivo</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn("w-2 h-2 rounded-full bg-unifique-success", pulso && "animate-ping")} />
                <p className="text-xs font-bold text-unifique-success uppercase tracking-widest">Live Operations</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold flex items-center gap-2">
              <ShieldCheck size={14} className="text-unifique-primary" />
              SLA: 99.9%
            </div>
            <button
              onClick={() => setLogs([])}
              className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-unifique-primary transition-all"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        {/* Agents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {AGENTES.map((ag) => (
            <motion.div
              key={ag.id}
              whileHover={{ y: -5 }}
              className={cn("glass-card p-6 border-l-4", ag.id === 'health' ? 'border-l-red-500' : ag.id === 'sdr' ? 'border-l-blue-500' : ag.id === 'bant' ? 'border-l-emerald-500' : 'border-l-purple-500')}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={cn("p-2 rounded-lg", ag.bg, ag.cor)}>
                  <ag.icon size={20} />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{ag.grupo}</span>
              </div>
              <h3 className="font-bold text-sm mb-1">{ag.nome}</h3>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    className={cn("h-full", ag.id === 'health' ? 'bg-red-500' : ag.id === 'sdr' ? 'bg-blue-500' : ag.id === 'bant' ? 'bg-emerald-500' : 'bg-purple-500')}
                    initial={{ width: "30%" }}
                    animate={{ width: "85%" }}
                    transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-500">Ativo</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Fila SDR — Leads */}
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center flex-shrink-0">
              <Zap size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold">Fila SDR — Leads</h2>
              <p className="text-[11px] text-slate-500">
                Contas com status <strong>Lead</strong> ficam fora do Diagnóstico da Agenda do Dia. O Agente SDR
                executa a cadência até converter em <strong>Negociando</strong> ou <strong>Ativo</strong>.
              </p>
            </div>
            <div className="ml-auto flex flex-wrap items-center gap-2 text-[10px] font-bold">
              <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700">{leads.length} leads</span>
              <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">{leadsProntos} prontos</span>
              {leadsPendentes > 0 && (
                <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                  {leadsPendentes} com contato incompleto
                </span>
              )}
            </div>
          </div>

          <div className="px-4 py-2.5 border-b border-slate-100 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            {CADENCIA_SDR.map((e, i) => (
              <React.Fragment key={e.dia}>
                <div className="flex items-center gap-1.5" title={e.objetivo}>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                    D+{e.dia}
                  </span>
                  <span className="text-[10px] text-slate-500">{e.titulo}</span>
                  <span className="text-[9px] font-bold text-slate-400">({e.canal})</span>
                </div>
                {i < CADENCIA_SDR.length - 1 && <ArrowRight size={10} className="text-slate-300 flex-shrink-0" />}
              </React.Fragment>
            ))}
          </div>

          {leadsLoading ? (
            <div className="p-8 flex justify-center text-slate-400">
              <RefreshCw size={18} className="animate-spin" />
            </div>
          ) : leads.length === 0 ? (
            <div className="p-8 flex flex-col items-center gap-1.5 text-slate-400">
              <Building2 size={22} />
              <p className="text-sm font-medium">Nenhuma conta com status Lead no momento.</p>
              <p className="text-[11px]">Cadastre a empresa em Empresas com status Lead para o SDR assumir a prospecção.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-50">
              {leads.map((lead) => {
                const aberto = leadAberto === lead.id;
                const pend = pendenciasContato(paraLead(lead));
                const dia = etapaPorLead[lead.id] ?? 0;
                const texto = textoEtapa(lead, dia);
                const assunto =
                  dia === 0
                    ? emailProspeccao(paraLead(lead), user?.nome).assunto
                    : `Acompanhamento Unifique — ${lead.nome}`;
                const wa = linkWhatsApp(lead.tel, texto);
                const mail = linkEmail(lead.email_contato, assunto, texto);
                const gancho = GANCHOS_PLAYBOOK[leads.indexOf(lead) % GANCHOS_PLAYBOOK.length];

                return (
                  <li key={lead.id}>
                    <button
                      type="button"
                      onClick={() => setLeadAberto(aberto ? null : lead.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-all text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <Building2 size={15} className="text-slate-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{lead.nome}</p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {lead.segmento ?? 'Sem segmento'} · {lead.contato || 'sem contato principal'}
                          {lead.email_contato ? ` · ${lead.email_contato}` : ''}
                          {lead.tel ? ` · ${lead.tel}` : ''}
                        </p>
                      </div>
                      <span
                        className={cn(
                          'text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0',
                          pend.length === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        )}
                      >
                        {pend.length === 0 ? 'Pronto p/ cadência' : `Falta ${pend.join(', ')}`}
                      </span>
                      <ChevronDown
                        size={14}
                        className={cn('text-slate-400 flex-shrink-0 transition-transform', aberto && 'rotate-180')}
                      />
                    </button>

                    {aberto && (
                      <div className="px-4 pb-4 pt-1 bg-slate-50/70">
                        {pend.length > 0 && (
                          <p className="flex items-start gap-1.5 text-[10px] text-amber-600 mb-2">
                            <AlertCircle size={11} className="mt-0.5 flex-shrink-0" />
                            <span>
                              Complete o contato principal em <strong>Empresas</strong> (nome, e-mail e telefone)
                              para o agente conseguir disparar a cadência por WhatsApp/O365.
                            </span>
                          </p>
                        )}

                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {CADENCIA_SDR.map((e) => (
                            <button
                              key={e.dia}
                              type="button"
                              onClick={() => setEtapaPorLead((p) => ({ ...p, [lead.id]: e.dia }))}
                              className={cn(
                                'px-2 py-1 rounded-lg text-[10px] font-bold border transition-all',
                                dia === e.dia
                                  ? 'bg-unifique-primary text-white border-unifique-primary'
                                  : 'bg-white text-slate-500 border-slate-200 hover:border-unifique-primary/40'
                              )}
                            >
                              D+{e.dia} · {e.canal}
                            </button>
                          ))}
                        </div>

                        <pre className="whitespace-pre-wrap text-[11px] leading-relaxed text-slate-600 bg-white border border-slate-200 rounded-lg p-3 max-h-40 overflow-y-auto font-sans">
                          {texto}
                        </pre>

                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <a
                            href={wa || undefined}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all',
                              wa
                                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                : 'bg-slate-100 text-slate-400 pointer-events-none'
                            )}
                          >
                            <MessageSquare size={12} /> WhatsApp
                          </a>
                          <a
                            href={mail || undefined}
                            className={cn(
                              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all',
                              mail
                                ? 'bg-unifique-primary text-white hover:bg-unifique-primary/90'
                                : 'bg-slate-100 text-slate-400 pointer-events-none'
                            )}
                          >
                            <Mail size={12} /> E-mail
                          </a>
                          <button
                            type="button"
                            onClick={() => copiar(lead.id, texto)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-white border border-slate-200 text-slate-600 hover:border-unifique-primary/40 transition-all"
                          >
                            {copiado === lead.id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                            {copiado === lead.id ? 'Copiado' : 'Copiar'}
                          </button>
                          {lead.tel && (
                            <span className="flex items-center gap-1 text-[10px] text-slate-400">
                              <Phone size={11} /> {lead.tel}
                            </span>
                          )}
                          <a
                            href="/integracoes/o365"
                            className="flex items-center gap-1 text-[10px] font-bold text-slate-600 hover:text-unifique-primary"
                            title="Lead respondeu? Consulte a agenda e envie o convite pelo Office 365"
                          >
                            <Calendar size={11} /> Agendar (O365)
                          </a>
                          <a href="/empresas" className="ml-auto text-[10px] font-bold text-unifique-primary hover:underline">
                            Editar contato →
                          </a>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Qualificar:</span>
                          {(['Negociando', 'Ativo'] as const).map((novo) => (
                            <button
                              key={novo}
                              type="button"
                              disabled={convertendo === lead.id}
                              onClick={() => converterStatus(lead, novo)}
                              className={cn(
                                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all disabled:opacity-50',
                                novo === 'Negociando'
                                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
                              )}
                              title={`Mover ${lead.nome} para ${novo} — sai da fila SDR e entra no Diagnóstico`}
                            >
                              <Target size={12} />
                              {convertendo === lead.id ? 'Salvando...' : `→ ${novo}`}
                            </button>
                          ))}
                          <span className="text-[10px] text-slate-400">
                            move a conta da fila SDR para o Diagnóstico da Agenda do Dia
                          </span>
                        </div>

                        {erroConversao && leadAberto === lead.id && (
                          <p className="mt-1 text-[10px] font-medium text-red-600">{erroConversao}</p>
                        )}

                        <p className="text-[10px] text-slate-500 mt-2">
                          <strong>Gancho do playbook · {gancho.frente}</strong> ({gancho.parceiros}): {gancho.pergunta}
                        </p>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Live Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 glass-card overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Activity size={16} className="text-unifique-primary" />
                Log de Processamento Real-time
              </h2>
              <span className="text-[10px] text-slate-500 font-mono tracking-tighter">LATENCY: 12ms</span>
            </div>
            <div className="p-2 min-h-[320px]">
              <AnimatePresence mode="popLayout">
                {logs.map((log) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-all border-b border-slate-100 last:border-none"
                  >
                    <span className="text-[10px] font-mono text-slate-400 w-16">{log.ts}</span>
                    <span className="text-xs font-bold text-unifique-primary w-32 truncate">{log.ag}</span>
                    <p className="text-xs text-slate-600 flex-1 truncate">{log.msg}</p>
                    <div className="w-1.5 h-1.5 rounded-full bg-unifique-success shadow-[0_0_8px_rgba(29,158,117,0.6)]" />
                  </motion.div>
                ))}
                {logs.length === 0 && (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs font-medium pt-16">
                    Aguardando eventos...
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-card p-6 border-none relative overflow-hidden group" style={{ background: 'linear-gradient(135deg, #0057B8 0%, #1d4ed8 100%)' }}>
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <Zap size={80} />
              </div>
              <h3 className="font-bold text-lg mb-2 text-white">IA Insights</h3>
              <p className="text-white/80 text-xs leading-relaxed mb-6">
                Agentes monitorando pipeline em tempo real. Tarefas e follow-ups sincronizados com a base de dados.
              </p>
              <button className="w-full py-2.5 bg-white text-unifique-primary rounded-xl text-xs font-bold shadow-xl">
                Acessar Score BANT
              </button>
            </div>

            <div className="glass-card p-6">
              <h3 className="font-bold text-sm mb-4">Performance dos Agentes</h3>
              <div className="space-y-4">
                {[
                  { label: "Tarefas Monitoradas", value: totalTarefas, icon: RefreshCw },
                  { label: "Leads Qualificados", value: "12", icon: Target },
                  { label: "Follow-ups Ativos", value: followUps, icon: MessageSquare },
                ].map((stat, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <stat.icon size={16} className="text-slate-400" />
                      <span className="text-xs text-slate-500 font-medium">{stat.label}</span>
                    </div>
                    <span className="text-sm font-bold">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
