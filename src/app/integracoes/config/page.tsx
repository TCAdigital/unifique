"use client";

import { useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { cn } from "@/lib/utils";
import {
  Settings,
  MessageCircle,
  Video,
  Mail,
  Shield,
  Database,
  Bell,
  Check,
  ChevronRight,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface IntegConfig {
  id: string;
  nome: string;
  descricao: string;
  icon: React.ElementType;
  cor: string;
  status: "Conectado" | "Desconectado" | "Configurando";
  detalhes: Record<string, string>;
}

const INTEGRACOES: IntegConfig[] = [
  {
    id: "whatsapp",
    nome: "WhatsApp Business API",
    descricao: "Mensagens diretamente no CRM via Meta Business API",
    icon: MessageCircle,
    cor: "#25D366",
    status: "Conectado",
    detalhes: {
      "Número verificado": "+55 (47) 3000-0000",
      "Conta": "Rede Unifique Business",
      "Versão API": "v19.0",
      "Webhook": "POST /webhook/whatsapp",
    },
  },
  {
    id: "teams",
    nome: "Microsoft Teams",
    descricao: "Reuniões e canais do Teams integrados ao pipeline",
    icon: Video,
    cor: "#464EB8",
    status: "Conectado",
    detalhes: {
      "Tenant": "redeunifique.com.br",
      "Endpoint": "graph.microsoft.com/v1.0",
      "Autenticação": "OAuth2 Bearer Token",
      "Escopo": "Calendars.ReadWrite, Team.Read",
    },
  },
  {
    id: "o365",
    nome: "Microsoft Office 365",
    descricao: "E-mail e calendário do Outlook sincronizados",
    icon: Mail,
    cor: "#0078D4",
    status: "Conectado",
    detalhes: {
      "Conta": "tadeu.alves@redeunifique.com.br",
      "Tenant": "redeunifique.com.br",
      "Autenticação": "MSAL OAuth2 + OpenID",
      "Escopos": "Mail.Read, Calendars.Read",
    },
  },
  {
    id: "supabase",
    nome: "Supabase PostgreSQL",
    descricao: "Banco de dados principal com Row-Level Security",
    icon: Database,
    cor: "#3ECF8E",
    status: "Conectado",
    detalhes: {
      "Host": "db.redeunifique.internal",
      "Database": "unifique_crm_prod",
      "SSL": "Obrigatório",
      "RLS": "Ativo em todas as tabelas",
    },
  },
];

const STATUS_CFG = {
  Conectado: { color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800", dot: "bg-emerald-500", icon: Check },
  Desconectado: { color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800", dot: "bg-red-500", icon: AlertCircle },
  Configurando: { color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800", dot: "bg-amber-500", icon: RefreshCw },
};

export default function ConfigPage() {
  const [expandido, setExpandido] = useState<string | null>(null);

  return (
    <Shell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center">
            <Settings size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-outfit">
              Configurações
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Gerenciamento de integrações e permissões · Acesso restrito: Administrador
            </p>
          </div>
          <div className="ml-auto">
            <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-full border border-purple-200 dark:border-purple-800">
              <Shield size={11} />
              Admin Only
            </span>
          </div>
        </div>

        {/* Status geral */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Integrações Ativas", value: INTEGRACOES.filter(i => i.status === "Conectado").length, total: INTEGRACOES.length, color: "text-emerald-600" },
            { label: "Usuários Ativos", value: 5, total: 5, color: "text-unifique-primary" },
            { label: "Tabelas RLS", value: 7, total: 7, color: "text-blue-600" },
            { label: "Uptime", value: "99.9%", total: null, color: "text-emerald-600" },
          ].map((k) => (
            <div key={k.label} className="glass-card p-5 text-center">
              <p className={cn("text-2xl font-bold font-outfit", k.color)}>
                {k.value}{k.total ? `/${k.total}` : ""}
              </p>
              <p className="text-[11px] text-slate-500 font-medium mt-1">{k.label}</p>
            </div>
          ))}
        </div>

        {/* Integrations */}
        <div>
          <h2 className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-3 uppercase tracking-wider">
            Integrações
          </h2>
          <div className="space-y-3">
            {INTEGRACOES.map((integ) => {
              const cfg = STATUS_CFG[integ.status];
              const StIcon = cfg.icon;
              const isExp = expandido === integ.id;

              return (
                <div key={integ.id} className="glass-card overflow-hidden">
                  <button
                    className="w-full flex items-center gap-4 p-5 hover:bg-slate-50 dark:hover:bg-white/5 transition-all text-left"
                    onClick={() => setExpandido(isExp ? null : integ.id)}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${integ.cor}20` }}
                    >
                      <integ.icon size={20} style={{ color: integ.cor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm">{integ.nome}</p>
                      <p className="text-xs text-slate-500 truncate">{integ.descricao}</p>
                    </div>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border flex-shrink-0",
                        cfg.bg,
                        cfg.color
                      )}
                    >
                      <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot, integ.status === "Conectado" && "animate-pulse")} />
                      {integ.status}
                    </span>
                    <ChevronRight
                      size={16}
                      className={cn("text-slate-400 transition-transform ml-1", isExp && "rotate-90")}
                    />
                  </button>

                  {isExp && (
                    <div className="px-5 pb-5 border-t border-slate-100 dark:border-white/5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                        {Object.entries(integ.detalhes).map(([k, v]) => (
                          <div key={k} className="flex flex-col gap-0.5 p-3 bg-slate-50 dark:bg-white/5 rounded-lg">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{k}</span>
                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300 font-mono">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Profiles */}
        <div>
          <h2 className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-3 uppercase tracking-wider">
            Perfis de Acesso
          </h2>
          <div className="glass-card overflow-hidden">
            {[
              { perfil: "Administrador", cor: "#7C3AED", acesso: "Irrestrito — todos os módulos e dados", usuario: "Tadeu Alves" },
              { perfil: "Gerente Comercial", cor: "#0057B8", acesso: "Vê dados de toda a equipe · Bloqueia: Configurações", usuario: "Maria Souza" },
              { perfil: "Consultor", cor: "#1D9E75", acesso: "Vê apenas próprios dados · Bloqueia: Configurações, Relatórios TI", usuario: "João Silva, Ana Paula" },
              { perfil: "Pré Venda", cor: "#D97706", acesso: "Vê apenas próprios dados · Bloqueia: Orçamento, Vendas TI, Config", usuario: "Carlos Lima" },
            ].map((p, i) => (
              <div key={p.perfil} className={cn("flex items-center gap-4 px-5 py-4", i > 0 && "border-t border-slate-100 dark:border-white/5")}>
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: p.cor }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm" style={{ color: p.cor }}>{p.perfil}</p>
                  <p className="text-xs text-slate-500 truncate">{p.acesso}</p>
                </div>
                <p className="text-xs text-slate-400 flex-shrink-0">{p.usuario}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  );
}
