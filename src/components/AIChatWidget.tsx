"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  CheckSquare,
  ChevronDown,
  ChevronUp,
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

const SUGGESTIONS = [
  "Especificações técnicas do produto",
  "Como configurar este equipamento?",
  "Diferenças entre os modelos?",
  "Tabela de licenciamento",
];

function renderAnswer(text: string) {
  const safe = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const html = safe
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(
      /`([^`]+)`/g,
      '<code style="background:rgba(0,0,0,0.35);padding:0 4px;border-radius:3px;font-family:monospace;font-size:11px">$1</code>'
    )
    .replace(/\n/g, "<br/>");
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

export function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatError, setChatError] = useState("");
  const [showDocs, setShowDocs] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);

  const [showUpload, setShowUpload] = useState(false);
  const [uFile, setUFile] = useState<File | null>(null);
  const [uNome, setUNome] = useState("");
  const [uTags, setUTags] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-ai-widget", handler);
    return () => window.removeEventListener("open-ai-widget", handler);
  }, []);

  useEffect(() => {
    if (open && docs.length === 0) loadDocs();
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function loadDocs() {
    setLoadingDocs(true);
    try {
      const res = await fetch("/api/conhecimento");
      const json = await res.json();
      setDocs(json.data ?? []);
    } finally {
      setLoadingDocs(false);
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
    if (!confirm("Remover esta fonte?")) return;
    await fetch(`/api/conhecimento/${id}`, { method: "DELETE" });
    setSelected((prev) => {
      const s = new Set(prev);
      s.delete(id);
      return s;
    });
    setDocs((prev) => prev.filter((d) => d.id !== id));
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!uFile) { setUploadErr("Selecione um PDF"); return; }
    setUploading(true);
    setUploadErr("");
    const fd = new FormData();
    fd.append("file", uFile);
    fd.append("nome", uNome || uFile.name.replace(/\.pdf$/i, ""));
    fd.append("tags", uTags);
    const res = await fetch("/api/conhecimento/upload", { method: "POST", body: fd });
    const json = await res.json();
    setUploading(false);
    if (json.error) { setUploadErr(json.error); return; }
    setDocs((prev) => [json.data, ...prev]);
    setSelected((prev) => new Set([...prev, json.data.id]));
    setShowUpload(false);
    setUFile(null); setUNome(""); setUTags("");
  }

  async function handleSend(question?: string) {
    const q = (question ?? input).trim();
    if (!q || loading) return;
    if (selected.size === 0) {
      setChatError('Selecione ao menos uma fonte em "Fontes de Conhecimento".');
      setShowDocs(true);
      return;
    }
    setChatError("");
    setInput("");
    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: q };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    const res = await fetch("/api/conhecimento/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documentIds: [...selected],
        question: q,
        history: messages.slice(-6),
      }),
    });
    const json = await res.json();
    setLoading(false);
    setMessages((prev) => [
      ...prev,
      {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: json.error ? `Erro: ${json.error}` : json.answer,
      },
    ]);
  }

  return (
    <>
      {/* ── Floating button ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed z-50 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
        style={{
          bottom: 28,
          right: 28,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: open
            ? "linear-gradient(135deg, #002060, #003080)"
            : "linear-gradient(135deg, #0057B8, #00C8F0)",
          boxShadow: open
            ? "0 4px 16px rgba(0,0,0,0.4)"
            : "0 4px 24px rgba(0,87,184,0.55), 0 0 0 4px rgba(0,200,240,0.08)",
        }}
        title="Unifique IA"
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X size={22} className="text-white" />
            </motion.span>
          ) : (
            <motion.span key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <Sparkles size={22} className="text-white" />
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* ── Chat panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed z-40 flex flex-col overflow-hidden"
            style={{
              bottom: 96,
              right: 28,
              width: 420,
              height: 600,
              borderRadius: 20,
              background: "linear-gradient(170deg, #001840 0%, #002060 100%)",
              border: "1px solid rgba(0,200,240,0.15)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
              style={{ borderBottom: "1px solid rgba(0,200,240,0.1)" }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #0057B8, #00C8F0)", boxShadow: "0 0 12px rgba(0,200,240,0.3)" }}
              >
                <Sparkles size={15} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white leading-tight">Unifique IA</p>
                <p className="text-[10px] leading-tight" style={{ color: "#7A9BB8" }}>
                  {selected.size > 0
                    ? `${selected.size} fonte${selected.size > 1 ? "s" : ""} ativa${selected.size > 1 ? "s" : ""}`
                    : "Powered by Google Gemini"}
                </p>
              </div>
              {messages.length > 0 && (
                <button
                  onClick={() => setMessages([])}
                  className="text-[10px] transition-all mr-1"
                  style={{ color: "#7A9BB8" }}
                  onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#fff")}
                  onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#7A9BB8")}
                >
                  Limpar
                </button>
              )}
            </div>

            {/* Fontes accordion */}
            <div className="flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <button
                onClick={() => setShowDocs((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-2 text-xs font-medium transition-all"
                style={{ color: "#7A9BB8" }}
                onMouseEnter={(e) => ((e.currentTarget.style.color = "#fff"))}
                onMouseLeave={(e) => ((e.currentTarget.style.color = "#7A9BB8"))}
              >
                <span className="flex items-center gap-2">
                  <FileText size={12} style={{ color: "#00C8F0" }} />
                  Fontes de Conhecimento
                  {docs.length > 0 && (
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                      style={{ background: "rgba(0,200,240,0.15)", color: "#00C8F0" }}
                    >
                      {docs.length}
                    </span>
                  )}
                  {selected.size > 0 && (
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                      style={{ background: "rgba(0,200,240,0.25)", color: "#00C8F0" }}
                    >
                      {selected.size} ativa{selected.size > 1 ? "s" : ""}
                    </span>
                  )}
                </span>
                {showDocs ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>

              <AnimatePresence>
                {showDocs && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    style={{ overflow: "hidden" }}
                  >
                    <div
                      className="px-3 pb-3 space-y-1.5"
                      style={{ background: "rgba(0,0,0,0.25)", maxHeight: 176, overflowY: "auto" }}
                    >
                      {loadingDocs ? (
                        <div className="flex justify-center py-3">
                          <Loader2 size={15} className="animate-spin text-slate-500" />
                        </div>
                      ) : docs.length === 0 ? (
                        <p className="text-xs text-slate-500 py-2 text-center">
                          Nenhum documento ainda.
                        </p>
                      ) : (
                        docs.map((doc) => {
                          const active = selected.has(doc.id);
                          return (
                            <div
                              key={doc.id}
                              onClick={() => toggleDoc(doc.id)}
                              className="flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer transition-all"
                              style={{
                                background: active ? "rgba(0,200,240,0.1)" : "rgba(255,255,255,0.03)",
                                border: active
                                  ? "1px solid rgba(0,200,240,0.3)"
                                  : "1px solid rgba(255,255,255,0.05)",
                              }}
                            >
                              {active
                                ? <CheckSquare size={12} style={{ color: "#00C8F0", flexShrink: 0 }} />
                                : <Square size={12} className="text-slate-600 flex-shrink-0" />
                              }
                              <span className="text-xs text-slate-200 flex-1 truncate">{doc.nome}</span>
                              <button
                                onClick={(e) => { e.stopPropagation(); deleteDoc(doc.id); }}
                                className="text-slate-600 hover:text-red-400 transition-all flex-shrink-0"
                              >
                                <Trash2 size={10} />
                              </button>
                            </div>
                          );
                        })
                      )}
                      <button
                        onClick={() => setShowUpload(true)}
                        className="w-full flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-lg transition-all"
                        style={{
                          color: "#00C8F0",
                          border: "1px dashed rgba(0,200,240,0.3)",
                          background: "transparent",
                        }}
                        onMouseEnter={(e) => ((e.currentTarget.style.background = "rgba(0,200,240,0.05)"))}
                        onMouseLeave={(e) => ((e.currentTarget.style.background = "transparent"))}
                      >
                        <Plus size={11} /> Adicionar PDF
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {messages.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center h-full text-center gap-5">
                  <div>
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
                      style={{
                        background: "linear-gradient(135deg, #0057B8 0%, #00C8F0 100%)",
                        boxShadow: "0 0 32px rgba(0,200,240,0.25)",
                      }}
                    >
                      <Sparkles size={28} className="text-white" />
                    </div>
                    <p className="text-sm font-semibold text-white">Como posso ajudar?</p>
                    <p className="text-xs mt-1.5 max-w-[260px]" style={{ color: "#7A9BB8" }}>
                      {selected.size === 0
                        ? 'Abra "Fontes" acima, selecione um documento e faça sua pergunta.'
                        : `${selected.size} fonte${selected.size > 1 ? "s" : ""} ativa${selected.size > 1 ? "s" : ""}. Pronto para responder.`}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSend(s)}
                        className="text-xs px-3 py-1.5 rounded-full transition-all"
                        style={{
                          border: "1px solid rgba(255,255,255,0.12)",
                          background: "rgba(255,255,255,0.05)",
                          color: "#cbd5e1",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget.style.background = "rgba(255,255,255,0.1)");
                          (e.currentTarget.style.color = "#fff");
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget.style.background = "rgba(255,255,255,0.05)");
                          (e.currentTarget.style.color = "#cbd5e1");
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-0.5"
                      style={{ background: "linear-gradient(135deg, #0057B8, #00C8F0)" }}
                    >
                      <Sparkles size={11} className="text-white" />
                    </div>
                  )}
                  <div
                    className="max-w-[80%] rounded-2xl px-3 py-2.5 text-sm leading-relaxed"
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

              {loading && (
                <div className="flex justify-start">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center mr-2 flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #0057B8, #00C8F0)" }}
                  >
                    <Sparkles size={11} className="text-white" />
                  </div>
                  <div
                    className="rounded-2xl px-4 py-3"
                    style={{ background: "rgba(255,255,255,0.08)", borderTopLeftRadius: 6 }}
                  >
                    <div className="flex gap-1.5 items-center">
                      {[0, 150, 300].map((d) => (
                        <div
                          key={d}
                          className="w-2 h-2 rounded-full animate-bounce"
                          style={{ background: "#00C8F0", animationDelay: `${d}ms` }}
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
                <AlertCircle size={13} className="text-red-400 flex-shrink-0" />
                <p className="text-xs text-red-300 flex-1">{chatError}</p>
                <button onClick={() => setChatError("")}>
                  <X size={11} className="text-red-400" />
                </button>
              </div>
            )}

            {/* Input */}
            <div
              className="px-3 py-3 flex-shrink-0"
              style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
            >
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
                  placeholder="Pergunte sobre os documentos..."
                  disabled={loading}
                  rows={2}
                  className="flex-1 text-white text-sm rounded-xl px-3 py-2 resize-none outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#fff",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(0,200,240,0.4)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim() || selected.size === 0}
                  className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all disabled:opacity-35 disabled:cursor-not-allowed"
                  style={{ background: "#0057B8" }}
                  onMouseEnter={(e) => { if (!loading && input.trim()) (e.currentTarget.style.background = "#0041a0"); }}
                  onMouseLeave={(e) => { (e.currentTarget.style.background = "#0057B8"); }}
                >
                  {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Upload mini-modal ── */}
      <AnimatePresence>
        {showUpload && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-end"
            style={{ paddingBottom: 96 + 28 + 16, paddingRight: 28, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowUpload(false); }}
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ duration: 0.18 }}
              className="rounded-2xl p-5 shadow-2xl"
              style={{
                width: 320,
                background: "linear-gradient(135deg, #001840, #002060)",
                border: "1px solid rgba(0,200,240,0.18)",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white">Adicionar Fonte</h3>
                <button onClick={() => setShowUpload(false)} className="text-slate-400 hover:text-white transition-all">
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleUpload} className="space-y-3">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl p-4 text-center cursor-pointer transition-all"
                  style={{
                    border: uFile ? "2px dashed rgba(0,200,240,0.6)" : "2px dashed rgba(255,255,255,0.15)",
                    background: uFile ? "rgba(0,200,240,0.05)" : "transparent",
                  }}
                >
                  {uFile ? (
                    <>
                      <FileText size={20} style={{ color: "#00C8F0", margin: "0 auto 6px" }} />
                      <p className="text-xs text-white font-medium truncate">{uFile.name}</p>
                    </>
                  ) : (
                    <>
                      <Upload size={20} className="text-slate-500 mx-auto mb-1.5" />
                      <p className="text-xs text-slate-400">Clique para selecionar PDF</p>
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
                <input
                  value={uNome}
                  onChange={(e) => setUNome(e.target.value)}
                  required
                  placeholder="Nome do documento *"
                  className="w-full text-white text-xs rounded-lg px-3 py-2 outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
                />
                <input
                  value={uTags}
                  onChange={(e) => setUTags(e.target.value)}
                  placeholder="Tags: firewall, fortinet, sdwan..."
                  className="w-full text-white text-xs rounded-lg px-3 py-2 outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
                />
                {uploadErr && (
                  <p className="text-xs text-red-400 flex items-center gap-1.5">
                    <AlertCircle size={11} /> {uploadErr}
                  </p>
                )}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => { setShowUpload(false); setUploadErr(""); }}
                    className="flex-1 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-all"
                    style={{ background: "rgba(255,255,255,0.05)" }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={uploading || !uFile}
                    className="flex-1 py-2 rounded-xl text-xs font-medium text-white flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    style={{ background: "#0057B8" }}
                  >
                    {uploading ? (
                      <><Loader2 size={12} className="animate-spin" /> Enviando...</>
                    ) : (
                      <><Upload size={12} /> Enviar</>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
