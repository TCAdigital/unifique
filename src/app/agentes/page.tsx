"use client";

import React, { useEffect, useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { supabase } from '@/lib/supabase';
import {
  Cpu,
  Search,
  Activity,
  Zap,
  ShieldCheck,
  MessageSquare,
  Target,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

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
