"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Bell, HelpCircle, Plus, Search, Trash2, X } from "lucide-react";

type NotifTipo = "info" | "novidade" | "alerta" | "manutencao";

type Notificacao = {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: NotifTipo;
  autor: string | null;
  created_at: string;
};

const TIPO_CONFIG: Record<NotifTipo, { label: string; color: string; bg: string }> = {
  novidade:   { label: "Novidade",    color: "#00C8F0", bg: "rgba(0,200,240,0.12)"  },
  info:       { label: "Info",        color: "#0057B8", bg: "rgba(0,87,184,0.12)"   },
  alerta:     { label: "Alerta",      color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  manutencao: { label: "Manutenção",  color: "#EF4444", bg: "rgba(239,68,68,0.12)"  },
};

const STORAGE_KEY = "unifique_notif_read";

function getReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveReadIds(ids: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  return `${Math.floor(diff / 86400)}d atrás`;
}

export function Header() {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notificacao[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Create form
  const [showForm, setShowForm] = useState(false);
  const [fTitulo, setFTitulo] = useState("");
  const [fMensagem, setFMensagem] = useState("");
  const [fTipo, setFTipo] = useState<NotifTipo>("info");
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState("");

  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setReadIds(getReadIds());
    try {
      const role = localStorage.getItem("role") ?? "";
      setIsAdmin(role === "gestor");
    } catch {}
  }, []);

  const loadNotifs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notificacoes");
      const json = await res.json();
      setNotifs(json.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) loadNotifs();
  }, [open, loadNotifs]);

  // Mark all visible as read when panel opens
  useEffect(() => {
    if (open && notifs.length > 0) {
      const updated = new Set([...readIds, ...notifs.map((n) => n.id)]);
      setReadIds(updated);
      saveReadIds(updated);
    }
  }, [open, notifs]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
        setShowForm(false);
      }
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const unread = notifs.filter((n) => !readIds.has(n.id)).length;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!fTitulo.trim() || !fMensagem.trim()) { setFormErr("Preencha título e mensagem"); return; }
    setSaving(true);
    setFormErr("");
    try {
      const res = await fetch("/api/notificacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo: fTitulo, mensagem: fMensagem, tipo: fTipo, autor: "Equipe Unifique" }),
      });
      const json = await res.json();
      if (json.error) { setFormErr(json.error); return; }
      setNotifs((prev) => [json.data, ...prev]);
      setFTitulo(""); setFMensagem(""); setFTipo("info");
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover esta notificação?")) return;
    await fetch(`/api/notificacoes/${id}`, { method: "DELETE" });
    setNotifs((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <header className="h-16 glass-nav flex items-center justify-between px-6 z-10 flex-shrink-0">
      {/* Search */}
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-unifique-text-muted group-focus-within:text-unifique-primary transition-colors"
          />
          <input
            type="text"
            placeholder="Buscar empresas, negócios, leads..."
            className="w-full bg-unifique-bg border border-unifique-border-light focus:border-unifique-border focus:bg-white rounded-xl py-2 pl-9 pr-4 text-sm text-unifique-dark placeholder:text-unifique-text-muted transition-all outline-none focus:ring-2 focus:ring-unifique-primary/15"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 ml-4">
        {/* Bell */}
        <div className="relative" ref={panelRef}>
          <button
            onClick={() => { setOpen((v) => !v); setShowForm(false); }}
            className="relative p-2 text-unifique-text-sec hover:bg-unifique-bg rounded-lg transition-all"
          >
            <Bell size={18} />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-unifique-danger rounded-full border-2 border-white" />
            )}
            {unread === 0 && notifs.length === 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-unifique-danger rounded-full border-2 border-white" />
            )}
          </button>

          {/* Dropdown panel */}
          {open && (
            <div
              className="absolute right-0 mt-2 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
              style={{
                width: 360,
                maxHeight: 520,
                background: "linear-gradient(170deg, #f8faff 0%, #ffffff 100%)",
                border: "1px solid #e2e8f0",
                top: "calc(100% + 4px)",
                zIndex: 50,
              }}
            >
              {/* Panel header */}
              <div
                className="flex items-center justify-between px-4 py-3 flex-shrink-0"
                style={{ borderBottom: "1px solid #e2e8f0" }}
              >
                <div className="flex items-center gap-2">
                  <Bell size={15} className="text-unifique-primary" />
                  <span className="text-sm font-bold text-unifique-dark">Notificações</span>
                  {unread > 0 && (
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: "#EF4444", color: "#fff" }}
                    >
                      {unread}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {isAdmin && (
                    <button
                      onClick={() => setShowForm((v) => !v)}
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-all"
                      style={{
                        background: showForm ? "rgba(0,87,184,0.1)" : "transparent",
                        color: "#0057B8",
                        border: "1px solid rgba(0,87,184,0.2)",
                      }}
                      title="Nova notificação"
                    >
                      <Plus size={12} />
                      Nova
                    </button>
                  )}
                  <button
                    onClick={() => { setOpen(false); setShowForm(false); }}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded transition-all"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Create form (admin only) */}
              {showForm && isAdmin && (
                <form
                  onSubmit={handleCreate}
                  className="px-4 py-3 flex-shrink-0 space-y-2"
                  style={{ borderBottom: "1px solid #e2e8f0", background: "#f0f6ff" }}
                >
                  <input
                    value={fTitulo}
                    onChange={(e) => setFTitulo(e.target.value)}
                    placeholder="Título da notificação *"
                    className="w-full text-sm rounded-lg px-3 py-2 border outline-none transition-all"
                    style={{ borderColor: "#cbd5e1", background: "#fff" }}
                  />
                  <textarea
                    value={fMensagem}
                    onChange={(e) => setFMensagem(e.target.value)}
                    placeholder="Mensagem para os usuários... *"
                    rows={3}
                    className="w-full text-sm rounded-lg px-3 py-2 border outline-none transition-all resize-none"
                    style={{ borderColor: "#cbd5e1", background: "#fff" }}
                  />
                  <div className="flex gap-2">
                    <select
                      value={fTipo}
                      onChange={(e) => setFTipo(e.target.value as NotifTipo)}
                      className="flex-1 text-xs rounded-lg px-2 py-1.5 border outline-none"
                      style={{ borderColor: "#cbd5e1", background: "#fff" }}
                    >
                      <option value="info">Info</option>
                      <option value="novidade">Novidade</option>
                      <option value="alerta">Alerta</option>
                      <option value="manutencao">Manutenção</option>
                    </select>
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 text-xs py-1.5 rounded-lg font-semibold text-white transition-all disabled:opacity-50"
                      style={{ background: "#0057B8" }}
                    >
                      {saving ? "Enviando..." : "Publicar"}
                    </button>
                  </div>
                  {formErr && <p className="text-xs text-red-500">{formErr}</p>}
                </form>
              )}

              {/* List */}
              <div className="overflow-y-auto flex-1">
                {loading ? (
                  <div className="flex justify-center py-10">
                    <div className="w-5 h-5 rounded-full border-2 border-unifique-primary border-t-transparent animate-spin" />
                  </div>
                ) : notifs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2">
                    <Bell size={28} className="text-slate-300" />
                    <p className="text-sm text-slate-400">Sem notificações</p>
                  </div>
                ) : (
                  notifs.map((n) => {
                    const cfg = TIPO_CONFIG[n.tipo] ?? TIPO_CONFIG.info;
                    const isRead = readIds.has(n.id);
                    return (
                      <div
                        key={n.id}
                        className="flex gap-3 px-4 py-3 transition-all"
                        style={{
                          borderBottom: "1px solid #f1f5f9",
                          background: isRead ? "transparent" : "rgba(0,87,184,0.03)",
                        }}
                      >
                        {/* Tipo dot */}
                        <div className="flex-shrink-0 mt-0.5">
                          <div
                            className="w-2 h-2 rounded-full mt-1.5"
                            style={{ background: isRead ? "#cbd5e1" : cfg.color }}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span
                                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full mr-1.5"
                                style={{ background: cfg.bg, color: cfg.color }}
                              >
                                {cfg.label}
                              </span>
                              <span
                                className="text-xs font-semibold"
                                style={{ color: isRead ? "#64748b" : "#1e293b" }}
                              >
                                {n.titulo}
                              </span>
                            </div>
                            {isAdmin && (
                              <button
                                onClick={() => handleDelete(n.id)}
                                className="flex-shrink-0 text-slate-300 hover:text-red-400 transition-all"
                              >
                                <Trash2 size={11} />
                              </button>
                            )}
                          </div>
                          <p
                            className="text-xs mt-1 leading-relaxed"
                            style={{ color: isRead ? "#94a3b8" : "#475569" }}
                          >
                            {n.mensagem}
                          </p>
                          <p className="text-[10px] mt-1.5" style={{ color: "#94a3b8" }}>
                            {n.autor ? `${n.autor} · ` : ""}{timeAgo(n.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <button className="p-2 text-unifique-text-sec hover:bg-unifique-bg rounded-lg transition-all">
          <HelpCircle size={18} />
        </button>

        <div className="w-px h-6 bg-unifique-border-light mx-2" />

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-unifique-dark">Rede Unifique</p>
            <p className="text-[10px] text-unifique-text-muted">Unidade Corporate</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-unifique-primary to-unifique-cyan flex items-center justify-center text-xs font-bold text-white shadow-sm">
            TA
          </div>
        </div>
      </div>
    </header>
  );
}
