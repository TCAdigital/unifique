"use client";

import { useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { cn } from "@/lib/utils";
import { Mail, Calendar, User, Inbox, Send, Archive, Star, Clock, ChevronRight, ExternalLink } from "lucide-react";

const EMAILS_MOCK = [
  { id: "1", de: "carlos.mendes@grupomax.com.br", assunto: "RE: Proposta Plataforma CRM", preview: "Olá Tadeu, revisamos a proposta e temos algumas perguntas sobre o módulo de...", hora: "14:32", lido: false, estrela: true },
  { id: "2", de: "compras@retailgroup.com.br", assunto: "Solicitação de Orçamento — Licença Enterprise", preview: "Prezado, conforme alinhado na reunião de terça, seguem os requisitos para...", hora: "11:20", lido: false, estrela: false },
  { id: "3", de: "ti@suzano.com.br", assunto: "Kick-off Projeto — Confirmação", preview: "Confirmo presença para o kick-off na próxima quinta-feira às 11h. Seguem os...", hora: "09:15", lido: true, estrela: false },
  { id: "4", de: "diretoria@techbras.com.br", assunto: "Apresentação Executiva — Agendamento", preview: "Gostaria de agendar uma apresentação executiva da plataforma para o nosso...", hora: "Ontem", lido: true, estrela: true },
  { id: "5", de: "maria.souza@redeunifique.com.br", assunto: "Pipeline Review — Relatório Semanal", preview: "Tadeu, segue o relatório semanal do pipeline comercial. Destaques da semana...", hora: "Ontem", lido: true, estrela: false },
];

const EVENTOS_MOCK = [
  { id: "1", titulo: "Demo GrupoMax", data: "2026-04-28", hora: "14:00", tipo: "Reunião" },
  { id: "2", titulo: "Review Q2 — Equipe Comercial", data: "2026-04-29", hora: "09:30", tipo: "Interno" },
  { id: "3", titulo: "Kick-off Suzano", data: "2026-04-30", hora: "11:00", tipo: "Cliente" },
  { id: "4", titulo: "1:1 Maria Souza", data: "2026-05-02", hora: "10:00", tipo: "Interno" },
];

export default function O365Page() {
  const [aba, setAba] = useState<"inbox" | "calendar">("inbox");

  return (
    <Shell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0078D4, #005A9E)" }}>
            <Mail size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-outfit">
              Office 365
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              tadeu.alves@redeunifique.com.br
            </p>
          </div>
          <div className="ml-auto">
            <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full border border-blue-200 dark:border-blue-800">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Sincronizado
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Não lidos", value: EMAILS_MOCK.filter(e => !e.lido).length, icon: Inbox, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
            { label: "Com estrela", value: EMAILS_MOCK.filter(e => e.estrela).length, icon: Star, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
            { label: "Eventos hoje", value: 1, icon: Calendar, color: "text-unifique-primary", bg: "bg-unifique-primary/10" },
            { label: "Esta semana", value: EVENTOS_MOCK.length, icon: Clock, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
          ].map((k) => (
            <div key={k.label} className="glass-card p-5 flex items-center gap-3">
              <div className={cn("p-2.5 rounded-xl flex-shrink-0", k.bg)}>
                <k.icon size={18} className={k.color} />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">{k.label}</p>
                <p className={cn("text-2xl font-bold font-outfit", k.color)}>{k.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {[
            { key: "inbox", label: "Caixa de Entrada", icon: Inbox },
            { key: "calendar", label: "Calendário", icon: Calendar },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setAba(t.key as typeof aba)}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all",
                aba === t.key
                  ? "text-white shadow-md"
                  : "bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-blue-400"
              )}
              style={aba === t.key ? { background: "linear-gradient(135deg, #0078D4, #005A9E)" } : undefined}
            >
              <t.icon size={15} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {aba === "inbox" ? (
          <div className="glass-card overflow-hidden">
            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {EMAILS_MOCK.map((email) => (
                <div
                  key={email.id}
                  className={cn(
                    "flex items-center gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-all cursor-pointer",
                    !email.lido && "bg-blue-50/30 dark:bg-blue-900/5"
                  )}
                >
                  <div className="w-9 h-9 rounded-full bg-unifique-primary/10 flex items-center justify-center text-xs font-bold text-unifique-primary flex-shrink-0">
                    {email.de[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={cn("text-xs truncate", !email.lido ? "font-bold text-slate-900 dark:text-white" : "font-medium text-slate-600 dark:text-slate-400")}>
                        {email.de}
                      </p>
                      <span className="text-[10px] text-slate-400 flex-shrink-0 ml-2">{email.hora}</span>
                    </div>
                    <p className={cn("text-xs truncate mt-0.5", !email.lido ? "font-bold text-slate-800 dark:text-slate-200" : "text-slate-600 dark:text-slate-400")}>
                      {email.assunto}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{email.preview}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {email.estrela && <Star size={13} className="fill-amber-400 text-amber-400" />}
                    {!email.lido && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {EVENTOS_MOCK.map((ev) => (
              <div key={ev.id} className="glass-card p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex-shrink-0 flex flex-col items-center justify-center text-white" style={{ background: "linear-gradient(135deg, #0078D4, #005A9E)" }}>
                  <span className="text-[10px] font-bold uppercase">
                    {new Date(ev.data).toLocaleDateString("pt-BR", { month: "short" })}
                  </span>
                  <span className="text-lg font-bold leading-none">
                    {new Date(ev.data).getDate()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">{ev.titulo}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                    <span className="flex items-center gap-1"><Clock size={11} /> {ev.hora}</span>
                    <span className="px-2 py-0.5 bg-unifique-primary/10 text-unifique-primary rounded text-[10px] font-bold">{ev.tipo}</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400 flex-shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}
