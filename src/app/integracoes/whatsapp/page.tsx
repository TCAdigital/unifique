"use client";

import { useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { cn } from "@/lib/utils";
import {
  MessageCircle,
  Send,
  Phone,
  CheckCheck,
  Check,
  Clock,
  Search,
  Circle,
  Wifi,
  WifiOff,
} from "lucide-react";

interface Contato {
  id: string;
  nome: string;
  empresa: string;
  numero: string;
  ultimaMensagem: string;
  hora: string;
  naoLidas: number;
  online: boolean;
}

interface Mensagem {
  id: string;
  texto: string;
  hora: string;
  direcao: "entrada" | "saida";
  lido: boolean;
}

const CONTATOS_MOCK: Contato[] = [
  { id: "1", nome: "Carlos Mendes", empresa: "GrupoMax", numero: "+55 47 99100-1234", ultimaMensagem: "Podemos marcar a demo para amanhã?", hora: "14:32", naoLidas: 2, online: true },
  { id: "2", nome: "Sandra Lima", empresa: "Retail Group", numero: "+55 47 99200-5678", ultimaMensagem: "Obrigada pelas informações!", hora: "11:15", naoLidas: 0, online: false },
  { id: "3", nome: "Paulo Costa", empresa: "Suzano SA", numero: "+55 11 98800-9012", ultimaMensagem: "Vou verificar com o board.", hora: "09:40", naoLidas: 1, online: true },
  { id: "4", nome: "Marina Torres", empresa: "TechBras", numero: "+55 41 97700-3456", ultimaMensagem: "Aguardando a proposta.", hora: "Ontem", naoLidas: 0, online: false },
];

const MENSAGENS_MOCK: Record<string, Mensagem[]> = {
  "1": [
    { id: "m1", texto: "Bom dia! Temos interesse na plataforma CRM de vocês.", hora: "09:15", direcao: "entrada", lido: true },
    { id: "m2", texto: "Olá Carlos! Que ótimo. Posso te apresentar as funcionalidades essa semana.", hora: "09:30", direcao: "saida", lido: true },
    { id: "m3", texto: "Perfeito! Qual seria o melhor horário para você?", hora: "09:45", direcao: "entrada", lido: true },
    { id: "m4", texto: "Podemos marcar a demo para amanhã?", hora: "14:32", direcao: "entrada", lido: false },
  ],
  "2": [
    { id: "m5", texto: "Oi Sandra! Seguem os materiais que pedi para te enviar.", hora: "10:50", direcao: "saida", lido: true },
    { id: "m6", texto: "Obrigada pelas informações!", hora: "11:15", direcao: "entrada", lido: true },
  ],
  "3": [
    { id: "m7", texto: "Paulo, como ficou a discussão sobre o projeto?", hora: "09:10", direcao: "saida", lido: true },
    { id: "m8", texto: "Vou verificar com o board.", hora: "09:40", direcao: "entrada", lido: true },
  ],
  "4": [
    { id: "m9", texto: "Marina, preparamos a proposta comercial. Quando posso te enviar?", hora: "15:00", direcao: "saida", lido: true },
    { id: "m10", texto: "Aguardando a proposta.", hora: "15:20", direcao: "entrada", lido: true },
  ],
};

export default function WhatsAppPage() {
  const [contatoAtivo, setContatoAtivo] = useState<string>("1");
  const [busca, setBusca] = useState("");
  const [novaMensagem, setNovaMensagem] = useState("");

  const contatos = CONTATOS_MOCK.filter(
    (c) =>
      c.nome.toLowerCase().includes(busca.toLowerCase()) ||
      c.empresa.toLowerCase().includes(busca.toLowerCase())
  );

  const mensagens = MENSAGENS_MOCK[contatoAtivo] ?? [];
  const contatoInfo = CONTATOS_MOCK.find((c) => c.id === contatoAtivo);

  return (
    <Shell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
            <MessageCircle size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-outfit">
              WhatsApp Business
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <Wifi size={12} className="text-emerald-500" />
              <p className="text-slate-500 text-sm">
                Rede Unifique · +55 (47) 3000-0000 · Conta verificada
              </p>
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div className="glass-card overflow-hidden flex" style={{ height: "calc(100vh - 280px)", minHeight: 480 }}>
          {/* Contact List */}
          <div className="w-80 flex-shrink-0 border-r border-slate-100 dark:border-white/5 flex flex-col">
            <div className="p-3 border-b border-slate-100 dark:border-white/5">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar conversa..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {contatos.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setContatoAtivo(c.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-all text-left",
                    contatoAtivo === c.id && "bg-emerald-50 dark:bg-emerald-900/10 border-r-2 border-emerald-500"
                  )}
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-unifique-primary/10 flex items-center justify-center text-xs font-bold text-unifique-primary">
                      {c.nome.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                    </div>
                    {c.online && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold truncate">{c.nome}</p>
                      <span className="text-[10px] text-slate-400 flex-shrink-0 ml-1">{c.hora}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">{c.empresa}</p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{c.ultimaMensagem}</p>
                  </div>
                  {c.naoLidas > 0 && (
                    <span className="flex-shrink-0 w-5 h-5 bg-emerald-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                      {c.naoLidas}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            {contatoInfo && (
              <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100 dark:border-white/5 bg-white dark:bg-transparent">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-unifique-primary/10 flex items-center justify-center text-xs font-bold text-unifique-primary">
                    {contatoInfo.nome.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </div>
                  {contatoInfo.online && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold">{contatoInfo.nome}</p>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1">
                    {contatoInfo.online ? (
                      <><Circle size={7} className="fill-emerald-500 text-emerald-500" /> Online · {contatoInfo.empresa}</>
                    ) : (
                      <>{contatoInfo.empresa} · {contatoInfo.numero}</>
                    )}
                  </p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <Phone size={16} className="text-slate-400 cursor-pointer hover:text-emerald-500 transition-colors" />
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 dark:bg-white/2">
              {mensagens.map((m) => (
                <div
                  key={m.id}
                  className={cn("flex", m.direcao === "saida" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                      m.direcao === "saida"
                        ? "bg-emerald-500 text-white rounded-br-sm"
                        : "bg-white dark:bg-white/10 text-slate-800 dark:text-slate-200 rounded-bl-sm"
                    )}
                  >
                    <p>{m.texto}</p>
                    <div className={cn("flex items-center gap-1 mt-1 justify-end", m.direcao === "entrada" && "justify-start")}>
                      <span className={cn("text-[10px]", m.direcao === "saida" ? "text-white/70" : "text-slate-400")}>
                        {m.hora}
                      </span>
                      {m.direcao === "saida" && (
                        m.lido
                          ? <CheckCheck size={12} className="text-white/70" />
                          : <Check size={12} className="text-white/70" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-slate-100 dark:border-white/5 flex items-center gap-2">
              <input
                type="text"
                value={novaMensagem}
                onChange={(e) => setNovaMensagem(e.target.value)}
                placeholder="Digite uma mensagem..."
                onKeyDown={(e) => e.key === "Enter" && setNovaMensagem("")}
                className="flex-1 px-4 py-2.5 text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
              <button
                onClick={() => setNovaMensagem("")}
                className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center hover:bg-emerald-600 transition-colors shadow-lg"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
