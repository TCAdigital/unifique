"use client";

import React from "react";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard,
  Building2,
  Briefcase,
  CheckSquare,
  BarChart3,
  Cpu,
  LogOut,
  MessageSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Target,
  DollarSign,
  Flag,
  Star,
  FolderOpen,
  Wallet,
  ArrowLeftRight,
  FileBarChart,
  MessageCircle,
  Video,
  Mail,
  Kanban,
  Package,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const MENU_ITEMS = [
  {
    group: "HOME",
    items: [
      { id: "dashboard", label: "Painel Unificado", icon: LayoutDashboard, href: "/" },
    ],
  },
  {
    group: "CRM",
    items: [
      { id: "empresas", label: "Empresas", icon: Building2, href: "/empresas" },
      { id: "pipeline", label: "Pipeline", icon: Kanban, href: "/negocios" },
      { id: "scoring", label: "Lead Scoring", icon: Star, href: "/scoring" },
      { id: "atividades", label: "Atividades", icon: CheckSquare, href: "/atividades" },
      { id: "projetos", label: "Projetos", icon: FolderOpen, href: "/projetos" },
      { id: "ticket", label: "Ticket Médio", icon: Target, href: "/ticket" },
      { id: "orcamento", label: "Orçamento", icon: Wallet, href: "/orcamento" },
    ],
  },
  {
    group: "OKR",
    items: [
      { id: "okr", label: "OKR Eventos TIC", icon: Flag, href: "/okr" },
    ],
  },
  {
    group: "IA & INSIGHTS",
    items: [
      { id: "agentes", label: "Agentes Live", icon: Cpu, href: "/agentes" },
      { id: "forecast", label: "Forecast IA", icon: TrendingUp, href: "/forecast" },
    ],
  },
  {
    group: "BACKOFFICE TI",
    items: [
      { id: "ti-cadastro", label: "Estoque TIC", icon: Package, href: "/ti/estoque" },
      { id: "ti-movs", label: "Movimentações", icon: ArrowLeftRight, href: "/ti/movs" },
      { id: "ti-vendas", label: "Vendas e Finanças", icon: DollarSign, href: "/ti/vendas" },
      { id: "ti-relatorios", label: "Relatórios", icon: FileBarChart, href: "/ti/relatorios" },
    ],
  },
  {
    group: "INTEGRAÇÕES",
    items: [
      { id: "int-whats", label: "WhatsApp Business", icon: MessageCircle, href: "/integracoes/whatsapp" },
      { id: "int-teams", label: "Microsoft Teams", icon: Video, href: "/integracoes/teams" },
      { id: "int-o365", label: "Office 365", icon: Mail, href: "/integracoes/o365" },
      { id: "int-config", label: "Configurações", icon: Settings, href: "/integracoes/config" },
    ],
  },
];

interface SidebarProps {
  isOpen: boolean;
  toggle: () => void;
}

export function Sidebar({ isOpen, toggle }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside
      className={cn(
        "relative h-full transition-all duration-300 flex flex-col",
        isOpen ? "w-64" : "w-20"
      )}
      style={{ background: "linear-gradient(180deg, #001840 0%, #002E6D 100%)", borderRight: "1px solid rgba(0,200,240,0.08)" }}
    >
      {/* Logo */}
      <div className="p-6 flex items-center justify-between flex-shrink-0">
        {isOpen ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-unifique-primary rounded-lg flex items-center justify-center font-bold text-white">
              U
            </div>
            <span className="font-bold text-white text-xl tracking-tight">unifique</span>
          </div>
        ) : (
          <div className="w-8 h-8 bg-unifique-primary rounded-lg flex items-center justify-center font-bold text-white mx-auto">
            U
          </div>
        )}
      </div>

      {/* Toggle */}
      <button
        onClick={toggle}
        className="absolute -right-3 top-20 bg-unifique-primary text-white rounded-full p-1 z-10 shadow-md"
        style={{ border: "2px solid #001840" }}
      >
        {isOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-5 mt-2 pb-4">
        {MENU_ITEMS.map((group) => (
          <div key={group.group} className="space-y-0.5">
            {isOpen && (
              <p className="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: "#7A9BB8" }}>
                {group.group}
              </p>
            )}
            {!isOpen && <div className="border-t border-white/5 mx-2 my-2" />}
            {group.items.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group",
                    isActive
                      ? "text-white"
                      : "hover:text-white text-slate-400"
                  )}
                  style={isActive ? { background: "linear-gradient(90deg, rgba(0,87,184,0.7) 0%, rgba(0,200,240,0.15) 100%)", borderLeft: "2px solid #00C8F0" } : undefined}
                  title={!isOpen ? item.label : undefined}
                >
                  <Icon
                    size={18}
                    className={cn(
                      isActive
                        ? "text-unifique-cyan"
                        : "text-slate-400 group-hover:text-white"
                    )}
                  />
                  {isOpen && (
                    <span className="text-sm font-medium truncate">{item.label}</span>
                  )}
                  {isActive && isOpen && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-unifique-cyan shadow-[0_0_8px_rgba(0,200,240,0.6)] flex-shrink-0" />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User Footer */}
      <div className="p-4 flex-shrink-0" style={{ borderTop: "1px solid rgba(0,200,240,0.12)" }}>
        <div className={cn("flex items-center gap-3", !isOpen && "justify-center")}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-unifique-primary to-unifique-cyan flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-lg">
            {user?.avatar ?? "?"}
          </div>
          {isOpen && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{user?.nome ?? "—"}</p>
              <p className="text-[10px] truncate capitalize" style={{ color: "#7A9BB8" }}>{user?.perfil} · Unifique</p>
            </div>
          )}
          {isOpen && (
            <button
              onClick={logout}
              className="ml-auto p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all flex-shrink-0"
              title="Sair"
            >
              <LogOut size={15} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
