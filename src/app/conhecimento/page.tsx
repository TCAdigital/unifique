"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  CheckSquare,
  FileText,
  Loader2,
  Plus,
  Send,
  Sparkles,
  Square,
  Trash2,
  Upload,
  X,
} from "lucide-react";

type Doc = {
  id: string;
  nome: string;
  descricao: string | null;
  tags: string[];
  storage_path: string;
  storage_url: string;
  tamanho_bytes: number;
  created_at: string;
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${Math.round(b / 1024)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

function renderAnswer(text: string) {
  const safe = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const html = safe
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, '<code style="background:rgba(0,0,0,0.3);padding:0 4px;border-radius:3px;font-family:monospace;font-size:11px">$1</code>')
    .replace(/\n/g, "<br/>");
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function ConhecimentoPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [fetching, setFetching] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatError, setChatError] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [uNome, setUNome] = useState("");
  const [uDesc, setUDesc] = useState("");
  const [uTags, setUTags] = useState("");
  const [uFile, setUFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadDocs(); }, []);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function loadDocs() {
    setFetching(true);
    try {
      const res = await fetch("/api/conhecimento");
      const json = await res.json();
      setDocs(json.data ?? []);
    } finally {
      setFetching(false);
    }
  }

  function toggleDoc(id: string) {
    setSelected((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  }

  async function deleteDoc(id: string) {
    if (!confirm("Remover esta fonte de conhecimento?")) return;
    await fetch(`/api/conhecimento/${id}`, { method: "DELETE" });
    setSelected((prev) => { const s = new Set(prev); s.delete(id); return s; });
    setDocs((prev) => prev.filter((d) => d.id !== id));
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!uFile) { setUploadErr("Selecione um arquivo PDF"); return; }
    setUploading(true);
    setUploadErr("");
    const fd = new FormData();
    fd.append("file", uFile);
    fd.append("nome", uNome);
    fd.append("descricao", uDesc);
    fd.append("tags", uTags);
    const res = await fetch("/api/conhecimento/upload", { method: "POST", body: fd });
    const json = await res.json();
    setUploading(false);
    if (json.error) { setUploadErr(json.error); return; }
    setDocs((prev) => [json.data, ...prev]);
    setShowModal(false);
    setUNome(""); setUDesc(""); setUTags(""); setUFile(null);
  }

  async function handleSend() {
    if (!input.trim() || loading) return;
    if (selected.size === 0) {
      setChatError("Selecione ao menos um documento à esquerda antes de perguntar.");
      return;
    }
    setChatError("");
    const question = input.trim();
    setInput("");
    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: question };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    const res = await fetch("/api/conhecimento/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documentIds: [...selected],
        question,
        history: messages.slice(-6),
      }),
    });
    const json = await res.json();
    setLoading(false);

    const answer = json.error
      ? `Erro: ${json.error}`
      : json.answer;
    setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: "assistant", content: answer }]);
  }

  return (
    <div className="flex flex-col h-full gap-4 p-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen size={24} className="text-unifique-cyan" />
            Base de Conhecimento
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Faça perguntas sobre datasheets e documentos — powered by Google Gemini
          </p>
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">

        {/* ─── Left: Document List ─── */}
        <div className="col-span-4 flex flex-col glass-card rounded-xl overflow-hidden min-h-0">
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
            <span className="text-sm font-semibold text-white">
              Fontes
              {selected.size > 0 && (
                <span className="ml-2 text-xs" style={{ color: "#00C8F0" }}>
                  {selected.size} ativa{selected.size > 1 ? "s" : ""}
                </span>
              )}
            </span>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg text-white transition-all"
              style={{ background: "#0057B8" }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.background = "#0041a0")}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.background = "#0057B8")}
            >
              <Plus size={13} /> Nova Fonte
            </button>
          </div>

          {/* Doc list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {fetching ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 size={24} className="animate-spin" style={{ color: "#00C8F0" }} />
              </div>
            ) : docs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <FileText size={36} className="text-slate-600 mb-3" />
                <p className="text-sm text-slate-400 font-medium">Nenhuma fonte ainda</p>
                <p className="text-xs text-slate-600 mt-1">Adicione um PDF para começar</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="mt-4 text-xs px-4 py-2 rounded-lg text-white transition-all"
                  style={{ background: "#0057B8" }}
                >
                  + Adicionar Fonte
                </button>
              </div>
            ) : (
              docs.map((doc) => {
                const active = selected.has(doc.id);
                return (
                  <div
                    key={doc.id}
                    onClick={() => toggleDoc(doc.id)}
                    className="rounded-lg p-3 cursor-pointer transition-all"
                    style={{
                      border: active ? "1px solid rgba(0,200,240,0.5)" : "1px solid rgba(255,255,255,0.07)",
                      background: active ? "rgba(0,200,240,0.08)" : "rgba(255,255,255,0.04)",
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 flex-shrink-0">
                        {active
                          ? <CheckSquare size={14} style={{ color: "#00C8F0" }} />
                          : <Square size={14} className="text-slate-500" />
                        }
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-white truncate">{doc.nome}</p>
                        {doc.descricao && (
                          <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{doc.descricao}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] text-slate-500">{formatBytes(doc.tamanho_bytes)}</span>
                          <span className="text-[10px] text-slate-600">·</span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(doc.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                          </span>
                        </div>
                        {doc.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {doc.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[9px] px-1.5 py-0.5 rounded text-slate-300"
                                style={{ background: "rgba(0,87,184,0.4)" }}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteDoc(doc.id); }}
                        className="flex-shrink-0 p-1 text-slate-600 hover:text-red-400 transition-all"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {selected.size > 0 && (
            <div className="px-4 py-2 flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-[10px] text-slate-500 truncate">
                Contexto: {docs.filter((d) => selected.has(d.id)).map((d) => d.nome).join(" · ")}
              </p>
            </div>
          )}
        </div>

        {/* ─── Right: Chat ─── */}
        <div className="col-span-8 flex flex-col glass-card rounded-xl overflow-hidden min-h-0">
          {/* Chat header */}
          <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center gap-2">
              <Sparkles size={16} style={{ color: "#00C8F0" }} />
              <span className="text-sm font-semibold text-white">Chat Gemini</span>
              {selected.size > 0 && (
                <span className="text-xs text-slate-400">
                  · {selected.size} doc{selected.size > 1 ? "s" : ""} no contexto
                </span>
              )}
            </div>
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                className="text-xs text-slate-500 hover:text-slate-300 transition-all"
              >
                Limpar conversa
              </button>
            )}
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {messages.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center h-full text-center" style={{ opacity: 0.5 }}>
                <Sparkles size={44} style={{ color: "#00C8F0", marginBottom: 12 }} />
                <p className="text-sm text-white font-semibold">Pronto para responder</p>
                <p className="text-xs text-slate-400 mt-2 max-w-xs leading-relaxed">
                  {selected.size === 0
                    ? "Selecione um ou mais documentos à esquerda e faça sua pergunta."
                    : `${selected.size} documento(s) selecionado(s). Faça sua pergunta abaixo.`}
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center mr-2.5 flex-shrink-0 mt-0.5"
                    style={{ background: "linear-gradient(135deg, #0057B8, #00C8F0)" }}
                  >
                    <Sparkles size={12} className="text-white" />
                  </div>
                )}
                <div
                  className="max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
                  style={
                    msg.role === "user"
                      ? { background: "#0057B8", color: "#fff", borderTopRightRadius: 6 }
                      : { background: "rgba(255,255,255,0.08)", color: "#e2e8f0", borderTopLeftRadius: 6 }
                  }
                >
                  {msg.role === "assistant" ? renderAnswer(msg.content) : msg.content}
                </div>
              </div>
            ))}

            {/* Thinking dots */}
            {loading && (
              <div className="flex justify-start">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center mr-2.5 flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #0057B8, #00C8F0)" }}
                >
                  <Sparkles size={12} className="text-white" />
                </div>
                <div
                  className="rounded-2xl px-4 py-3.5"
                  style={{ background: "rgba(255,255,255,0.08)", borderTopLeftRadius: 6 }}
                >
                  <div className="flex gap-1.5 items-center">
                    {[0, 150, 300].map((delay) => (
                      <div
                        key={delay}
                        className="w-2 h-2 rounded-full animate-bounce"
                        style={{ background: "#00C8F0", animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Error bar */}
          {chatError && (
            <div
              className="px-4 py-2 flex items-center gap-2 flex-shrink-0"
              style={{ background: "rgba(239,68,68,0.1)", borderTop: "1px solid rgba(239,68,68,0.2)" }}
            >
              <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-300 flex-1">{chatError}</p>
              <button onClick={() => setChatError("")}>
                <X size={12} className="text-red-400" />
              </button>
            </div>
          )}

          {/* Input */}
          <div className="px-4 py-3 flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex gap-2 items-end"
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
                }}
                placeholder={
                  selected.size === 0
                    ? "Selecione documentos à esquerda para começar..."
                    : "Faça sua pergunta sobre os documentos selecionados..."
                }
                disabled={loading}
                rows={2}
                className="flex-1 text-white text-sm rounded-xl px-4 py-2.5 resize-none outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#fff",
                }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(0,200,240,0.4)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
              />
              <button
                type="submit"
                disabled={loading || !input.trim() || selected.size === 0}
                className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "#0057B8" }}
              >
                {loading
                  ? <Loader2 size={16} className="animate-spin" />
                  : <Send size={16} />
                }
              </button>
            </form>
            <p className="text-[10px] text-slate-600 mt-1.5">Enter para enviar · Shift+Enter para nova linha</p>
          </div>
        </div>
      </div>

      {/* ─── Upload Modal ─── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div
            className="glass-card rounded-2xl p-6 w-full max-w-md shadow-2xl"
            style={{ background: "linear-gradient(135deg, #001840 0%, #002060 100%)" }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">Nova Fonte de Conhecimento</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              {/* File picker */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl p-6 text-center cursor-pointer transition-all"
                style={{
                  border: uFile
                    ? "2px dashed rgba(0,200,240,0.6)"
                    : "2px dashed rgba(255,255,255,0.2)",
                  background: uFile ? "rgba(0,200,240,0.05)" : "transparent",
                }}
              >
                {uFile ? (
                  <>
                    <FileText size={28} style={{ color: "#00C8F0", margin: "0 auto 8px" }} />
                    <p className="text-sm text-white font-semibold">{uFile.name}</p>
                    <p className="text-xs text-slate-400 mt-1">{formatBytes(uFile.size)}</p>
                  </>
                ) : (
                  <>
                    <Upload size={28} className="text-slate-500 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">Clique para selecionar um PDF</p>
                    <p className="text-xs text-slate-600 mt-1">Datasheets, manuais, contratos...</p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setUFile(f);
                    if (f && !uNome) setUNome(f.name.replace(/\.pdf$/i, ""));
                  }}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Nome *</label>
                <input
                  value={uNome}
                  onChange={(e) => setUNome(e.target.value)}
                  required
                  placeholder="Ex: Datasheet Fortinet FortiGate 60F"
                  className="w-full text-white text-sm rounded-lg px-3 py-2 outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">
                  Descrição <span className="text-slate-600">(opcional)</span>
                </label>
                <textarea
                  value={uDesc}
                  onChange={(e) => setUDesc(e.target.value)}
                  rows={2}
                  placeholder="Breve descrição do conteúdo"
                  className="w-full text-white text-sm rounded-lg px-3 py-2 resize-none outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">
                  Tags <span className="text-slate-600">(separadas por vírgula)</span>
                </label>
                <input
                  value={uTags}
                  onChange={(e) => setUTags(e.target.value)}
                  placeholder="firewall, fortinet, segurança, sdwan"
                  className="w-full text-white text-sm rounded-lg px-3 py-2 outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}
                />
              </div>

              {uploadErr && (
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle size={13} />
                  <p className="text-xs">{uploadErr}</p>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setUploadErr(""); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white transition-all"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploading || !uFile}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: "#0057B8" }}
                >
                  {uploading
                    ? <><Loader2 size={14} className="animate-spin" /> Enviando...</>
                    : <><Upload size={14} /> Enviar</>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
