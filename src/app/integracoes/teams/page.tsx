"use client";

import { useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { cn } from "@/lib/utils";
import {
  Video,
  Users,
  Hash,
  Calendar,
  Clock,
  Plus,
  ExternalLink,
  MessageSquare,
  Bell,
  Settings,
} from "lucide-react";

const REUNIOES_MOCK = [
  { id: "1", titulo: "Demo — GrupoMax", horario: "2026-04-28T14:00:00", duracao: "45 min", participantes: ["Tadeu Alves", "Carlos Mendes", "Sandra Lima"], link: "#", status: "Próxima" },
  { id: "2", titulo: "Review Q2 Pipeline", horario: "2026-04-29T09:30:00", duracao: "60 min", participantes: ["Tadeu Alves", "Maria Souza", "João Silva"], link: "#", status: "Próxima" },
  { id: "3", titulo: "Kick-off Projeto Suzano", horario: "2026-04-30T11:00:00", duracao: "90 min", participantes: ["Tadeu Alves", "Paulo Costa"], link: "#", status: "Próxima" },
  { id: "4", titulo: "Alinhamento CRM — Retail", horario: "2026-04-25T15:00:00", duracao: "30 min", participantes: ["Tadeu Alves", "Sandra Lima"], link: "#", status: "Realizada" },
];

const CANAIS_MOCK = [
  { id: "1", nome: "geral", mensagens: 124, notLidas: 3 },
  { id: "2", nome: "vendas-crm", mensagens: 89, notLidas: 0 },
  { id: "3", nome: "ti-infraestrutura", mensagens: 45, notLidas: 1 },
  { id: "4", nome: "okr-2025", mensagens: 67, notLidas: 0 },
  { id: "5", nome: "eventos-tic", mensagens: 33, notLidas: 5 },
];

export default function TeamsPage() {
  const [aba, setAba] = useState<"reunioes" | "canais">("reunioes");

  const proximas = REUNIOES_MOCK.filter((r) => r.status === "Próxima");
  const realizadas = REUNIOES_MOCK.filter((r) => r.status === "Realizada");

  return (
    <Shell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#464EB8] rounded-xl flex items-center justify-center">
            <Video size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-outfit">
              Microsoft Teams
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Tenant: redeunifique.com.br · tadeu.alves@redeunifique.com.br
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-[#464EB8]/10 text-[#464EB8] rounded-full border border-[#464EB8]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#464EB8] animate-pulse" />
              Conectado
            </span>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Reuniões Esta Semana", value: proximas.length, icon: Video, color: "text-[#464EB8]", bg: "bg-[#464EB8]/10" },
            { label: "Canais da Equipe", value: CANAIS_MOCK.length, icon: Hash, color: "text-unifique-primary", bg: "bg-unifique-primary/10" },
            { label: "Notificações Pendentes", value: CANAIS_MOCK.reduce((s, c) => s + c.notLidas, 0), icon: Bell, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20" },
          ].map((k) => (
            <div key={k.label} className="glass-card p-5 flex items-center gap-4">
              <div className={cn("p-3 rounded-xl flex-shrink-0", k.bg)}>
                <k.icon size={20} className={k.color} />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">{k.label}</p>
                <p className={cn("text-2xl font-bold font-outfit", k.color)}>{k.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {[
            { key: "reunioes", label: "Reuniões", icon: Video },
            { key: "canais", label: "Canais", icon: Hash },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setAba(t.key as typeof aba)}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all",
                aba === t.key
                  ? "bg-[#464EB8] text-white shadow-md"
                  : "bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-[#464EB8]/40"
              )}
            >
              <t.icon size={15} />
              {t.label}
            </button>
          ))}
          <button className="ml-auto flex items-center gap-2 px-4 py-2.5 bg-[#464EB8] text-white rounded-lg text-sm font-bold hover:bg-[#3a42a8] transition-all shadow-lg">
            <Plus size={15} /> Nova Reunião
          </button>
        </div>

        {/* Content */}
        {aba === "reunioes" ? (
          <div className="space-y-6">
            {proximas.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-3">Próximas reuniões</h3>
                <div className="space-y-3">
                  {proximas.map((r) => (
                    <div key={r.id} className="glass-card p-5 flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#464EB8]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Video size={22} className="text-[#464EB8]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm">{r.titulo}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><Calendar size={11} /> {new Date(r.horario).toLocaleDateString("pt-BR")}</span>
                          <span className="flex items-center gap-1"><Clock size={11} /> {new Date(r.horario).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} · {r.duracao}</span>
                          <span className="flex items-center gap-1"><Users size={11} /> {r.participantes.length} participantes</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {r.participantes.map((p) => (
                            <span key={p} className="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-white/10 rounded-full text-slate-600 dark:text-slate-300">
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                      <a
                        href={r.link}
                        className="flex items-center gap-2 px-4 py-2 bg-[#464EB8] text-white rounded-lg text-xs font-bold hover:bg-[#3a42a8] transition-all flex-shrink-0"
                      >
                        <Video size={13} /> Entrar
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {realizadas.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-slate-400 mb-3">Reuniões realizadas</h3>
                <div className="space-y-2">
                  {realizadas.map((r) => (
                    <div key={r.id} className="glass-card p-4 flex items-center gap-3 opacity-70">
                      <div className="w-9 h-9 bg-slate-100 dark:bg-white/5 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Video size={16} className="text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-xs text-slate-600 dark:text-slate-400">{r.titulo}</p>
                        <p className="text-[11px] text-slate-400">
                          {new Date(r.horario).toLocaleDateString("pt-BR")} · {r.duracao} · {r.participantes.length} participantes
                        </p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 dark:bg-white/10 rounded-full text-slate-400">
                        Realizada
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="glass-card divide-y divide-slate-100 dark:divide-white/5 overflow-hidden">
            {CANAIS_MOCK.map((c) => (
              <div key={c.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-all cursor-pointer">
                <Hash size={16} className="text-slate-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">{c.nome}</p>
                  <p className="text-xs text-slate-400">{c.mensagens} mensagens</p>
                </div>
                <div className="flex items-center gap-3">
                  {c.notLidas > 0 && (
                    <span className="w-5 h-5 bg-[#464EB8] text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                      {c.notLidas}
                    </span>
                  )}
                  <ExternalLink size={14} className="text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}
