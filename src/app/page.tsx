"use client";

import { Shell } from "@/components/layout/Shell";
import { 
  TrendingUp, 
  Users, 
  Briefcase, 
  CheckCircle2,
  ChevronRight,
  ArrowUpRight,
  Target,
  Building2
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <Shell>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-outfit">
              Olá, Tadeu Alves
            </h1>
            <p className="text-slate-500 mt-1">
              Aqui está o que está acontecendo na Unifique hoje.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl shadow-sm text-sm font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-unifique-success animate-pulse" />
              Sistema Online
            </div>
            <button className="px-4 py-2 bg-unifique-primary text-white rounded-xl shadow-lg shadow-unifique-primary/25 text-sm font-bold hover:scale-[1.02] active:scale-[0.98] transition-all">
              Gerar Relatório Q2
            </button>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard 
            title="Empresas Ativas" 
            value="124" 
            trend="+12%" 
            icon={Building2} 
            color="blue"
          />
          <KpiCard 
            title="Pipeline Total" 
            value="R$ 1.2M" 
            trend="+8.4%" 
            icon={Briefcase} 
            color="cyan"
          />
          <KpiCard 
            title="Win Rate" 
            value="32%" 
            trend="+2.1%" 
            icon={TrendingUp} 
            color="green"
          />
          <KpiCard 
            title="Metas OKR" 
            value="78%" 
            trend="No prazo" 
            icon={Target} 
            color="purple"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2 glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">Negócios Recentes</h2>
              <button className="text-unifique-primary text-sm font-bold flex items-center gap-1 hover:underline">
                Ver todos <ChevronRight size={14} />
              </button>
            </div>
            
            <div className="space-y-4">
              {[
                { name: "Implantação CRM", company: "GrupoMax", value: "R$ 320k", status: "Fechamento", prob: 95 },
                { name: "Licença Enterprise", company: "Retail Group SA", value: "R$ 230k", status: "Negociação", prob: 65 },
                { name: "Consultoria TIC", company: "Suzano SA", value: "R$ 115k", status: "Proposta", prob: 40 },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all group border border-transparent hover:border-slate-200 dark:hover:border-white/10">
                  <div className="w-12 h-12 rounded-xl bg-unifique-primary/10 flex items-center justify-center text-unifique-primary">
                    <Briefcase size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.company} · {item.status}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-unifique-primary">{item.value}</p>
                    <p className="text-[10px] font-bold text-unifique-success">{item.prob}% prob.</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions / Insights */}
          <div className="space-y-6">
            <div className="glass-card p-6 bg-gradient-to-br from-unifique-primary to-blue-700 text-white border-none">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp size={20} />
              </div>
              <h3 className="font-bold text-lg mb-2">Previsão de Forecast</h3>
              <p className="text-white/70 text-sm mb-4">
                A IA estima um fechamento de R$ 420k nos próximos 15 dias baseado no histórico de engajamento.
              </p>
              <button className="w-full py-2 bg-white text-unifique-primary rounded-lg text-sm font-bold shadow-lg">
                Ver Detalhes IA
              </button>
            </div>

            <div className="glass-card p-6">
              <h3 className="font-bold text-sm mb-4">Próximas Tarefas</h3>
              <div className="space-y-3">
                {[
                  { title: "Follow-up Suzano", time: "14:30", type: "Call" },
                  { title: "Review Proposta Max", time: "16:00", type: "Email" },
                ].map((t, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10">
                    <CheckCircle2 size={16} className="text-slate-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">{t.title}</p>
                      <p className="text-[10px] text-slate-500">{t.time} · {t.type}</p>
                    </div>
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

interface KpiCardProps {
  title: string;
  value: string;
  trend: string;
  icon: any;
  color: "blue" | "green" | "cyan" | "purple";
}

function KpiCard({ title, value, trend, icon: Icon, color }: KpiCardProps) {
  const colors = {
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    cyan: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
    purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  };

  return (
    <div className="glass-card p-6 hover:translate-y-[-4px] transition-all duration-300 group">
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-2.5 rounded-xl", colors[color])}>
          <Icon size={20} />
        </div>
        <div className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 bg-slate-100 dark:bg-white/10 rounded-full">
          <ArrowUpRight size={10} className="text-unifique-success" />
          {trend}
        </div>
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{title}</p>
        <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white font-outfit">{value}</h3>
      </div>
    </div>
  );
}
