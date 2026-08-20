"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Loader2, Send, Sparkles, X } from "lucide-react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const SUGGESTIONS = [
  "Qual é o ICP para Cloud IaaS?",
  "Como aplicar o SPIN para cibersegurança?",
  "Diferenciais do FortiGate 120G?",
  "O que é o CrowdStrike Falcon Prevent?",
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatError, setChatError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-ai-widget", handler);
    return () => window.removeEventListener("open-ai-widget", handler);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSend(question?: string) {
    const q = (question ?? input).trim();
    if (!q || loading) return;
    setChatError("");
    setInput("");
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", content: q }]);
    setLoading(true);

    try {
      const res = await fetch("/api/conhecimento/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, history: messages.slice(-6) }),
      });
      const json = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: json.error ? `Erro: ${json.error}` : json.answer,
        },
      ]);
    } catch {
      setChatError("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* ── Floating button ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed z-50 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
        style={{
          bottom: 28, right: 28, width: 56, height: 56, borderRadius: "50%",
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
              bottom: 96, right: 28, width: 420, height: 560, borderRadius: 20,
              background: "linear-gradient(170deg, #001840 0%, #002060 100%)",
              border: "1px solid rgba(0,200,240,0.15)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0" style={{ borderBottom: "1px solid rgba(0,200,240,0.1)" }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #0057B8, #00C8F0)", boxShadow: "0 0 12px rgba(0,200,240,0.3)" }}>
                <Sparkles size={15} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white leading-tight">Unifique IA</p>
                <p className="text-[10px] leading-tight" style={{ color: "#7A9BB8" }}>Base de Conhecimento</p>
              </div>
              {messages.length > 0 && (
                <button onClick={() => setMessages([])} className="text-[10px] transition-all" style={{ color: "#7A9BB8" }}>
                  Limpar
                </button>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {messages.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center h-full text-center gap-5">
                  <div>
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "linear-gradient(135deg, #0057B8 0%, #00C8F0 100%)", boxShadow: "0 0 32px rgba(0,200,240,0.25)" }}>
                      <Sparkles size={28} className="text-white" />
                    </div>
                    <p className="text-sm font-semibold text-white">Como posso ajudar?</p>
                    <p className="text-xs mt-1.5 max-w-[260px]" style={{ color: "#7A9BB8" }}>
                      Pergunte sobre portfólio, metodologia comercial, soluções técnicas e mais.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSend(s)}
                        className="text-xs px-3 py-1.5 rounded-full transition-all"
                        style={{ border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", color: "#cbd5e1" }}
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
                    <div className="w-6 h-6 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-0.5" style={{ background: "linear-gradient(135deg, #0057B8, #00C8F0)" }}>
                      <Sparkles size={11} className="text-white" />
                    </div>
                  )}
                  <div
                    className="max-w-[80%] rounded-2xl px-3 py-2.5 text-sm leading-relaxed"
                    style={msg.role === "user"
                      ? { background: "#0057B8", color: "#fff", borderTopRightRadius: 6 }
                      : { background: "rgba(255,255,255,0.08)", color: "#e2e8f0", borderTopLeftRadius: 6 }}
                  >
                    {msg.role === "assistant" ? renderAnswer(msg.content) : msg.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center mr-2 flex-shrink-0" style={{ background: "linear-gradient(135deg, #0057B8, #00C8F0)" }}>
                    <Sparkles size={11} className="text-white" />
                  </div>
                  <div className="rounded-2xl px-4 py-3" style={{ background: "rgba(255,255,255,0.08)", borderTopLeftRadius: 6 }}>
                    <div className="flex gap-1.5 items-center">
                      {[0, 150, 300].map((d) => (
                        <div key={d} className="w-2 h-2 rounded-full animate-bounce" style={{ background: "#00C8F0", animationDelay: `${d}ms` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Error bar */}
            {chatError && (
              <div className="px-4 py-2 flex items-center gap-2 flex-shrink-0" style={{ background: "rgba(239,68,68,0.1)", borderTop: "1px solid rgba(239,68,68,0.2)" }}>
                <AlertCircle size={13} className="text-red-400 flex-shrink-0" />
                <p className="text-xs text-red-300 flex-1">{chatError}</p>
                <button onClick={() => setChatError("")}><X size={11} className="text-red-400" /></button>
              </div>
            )}

            {/* Input */}
            <div className="px-3 py-3 flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
              <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2 items-end">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Faça sua pergunta..."
                  disabled={loading}
                  rows={2}
                  className="flex-1 text-white text-sm rounded-xl px-3 py-2 resize-none outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(0,200,240,0.4)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all disabled:opacity-35 disabled:cursor-not-allowed"
                  style={{ background: "#0057B8" }}
                >
                  {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
