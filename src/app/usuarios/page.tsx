"use client";

import React, { useState, useEffect } from "react";
import { Shell } from "@/components/layout/Shell";
import { Users, Plus, Search, Edit2, X, Loader2, CheckCircle, XCircle, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

type Perfil = "admin" | "gerente" | "consultor" | "preVenda";

interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
  cargo?: string;
  avatar?: string;
  ativo: boolean;
  created_at: string;
}

const PERFIL_CONFIG: Record<Perfil, { label: string; color: string; bg: string }> = {
  admin:     { label: "Admin",     color: "text-purple-700", bg: "bg-purple-100" },
  gerente:   { label: "Gerente",   color: "text-blue-700",   bg: "bg-blue-100"   },
  consultor: { label: "Consultor", color: "text-emerald-700",bg: "bg-emerald-100"},
  preVenda:  { label: "Pré-Venda", color: "text-amber-700",  bg: "bg-amber-100"  },
};

const BLANK_FORM = {
  nome: "",
  email: "",
  senha: "",
  perfil: "consultor" as Perfil,
  cargo: "",
  ativo: true,
};

function initials(nome: string) {
  return nome.split(" ").slice(0, 2).map(p => p[0] ?? "").join("").toUpperCase();
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");

  async function loadData() {
    const { data } = await supabase
      .from("usuarios")
      .select("id, nome, email, perfil, cargo, avatar, ativo, created_at")
      .order("nome");
    setUsuarios((data ?? []) as Usuario[]);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  const filtered = usuarios.filter(u =>
    u.nome.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  function openCreate() {
    setEditId(null);
    setForm(BLANK_FORM);
    setErro("");
    setShowModal(true);
  }

  function openEdit(u: Usuario) {
    setEditId(u.id);
    setForm({ nome: u.nome, email: u.email, senha: "", perfil: u.perfil, cargo: u.cargo ?? "", ativo: u.ativo });
    setErro("");
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.nome.trim()) { setErro("Nome é obrigatório."); return; }
    if (!form.email.trim()) { setErro("E-mail é obrigatório."); return; }
    if (!editId && !form.senha.trim()) { setErro("Senha é obrigatória para novo usuário."); return; }

    setSaving(true);
    setErro("");

    const avatar = initials(form.nome);
    const payload: Record<string, unknown> = {
      nome: form.nome.trim(),
      email: form.email.trim().toLowerCase(),
      perfil: form.perfil,
      cargo: form.cargo.trim() || null,
      avatar,
      ativo: form.ativo,
    };
    if (form.senha.trim()) payload.password_hash = form.senha.trim();

    let error;
    if (editId) {
      ({ error } = await supabase.from("usuarios").update(payload).eq("id", editId));
    } else {
      ({ error } = await supabase.from("usuarios").insert(payload));
    }

    setSaving(false);
    if (error) { setErro("Erro: " + error.message); return; }
    setShowModal(false);
    loadData();
  }

  async function toggleAtivo(u: Usuario) {
    await supabase.from("usuarios").update({ ativo: !u.ativo }).eq("id", u.id);
    setUsuarios(prev => prev.map(x => x.id === u.id ? { ...x, ativo: !u.ativo } : x));
  }

  const totalAtivos = usuarios.filter(u => u.ativo).length;

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-outfit text-slate-900">Usuários & Perfis</h1>
            <p className="text-sm text-slate-500">Gerencie os acessos da plataforma.</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-unifique-primary text-white rounded-xl font-bold shadow-lg shadow-unifique-primary/20 hover:scale-[1.02] transition-all"
          >
            <Plus size={18} />
            Novo Usuário
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(["admin","gerente","consultor","preVenda"] as Perfil[]).map(p => {
            const cfg = PERFIL_CONFIG[p];
            const count = usuarios.filter(u => u.perfil === p).length;
            return (
              <div key={p} className="glass-card p-4 flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", cfg.bg)}>
                  <Shield size={16} className={cfg.color} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{cfg.label}</p>
                  <p className="text-xl font-bold text-slate-900">{count}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Busca */}
        <div className="glass-card p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Buscar por nome ou e-mail..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary/50 transition-all"
            />
          </div>
        </div>

        {/* Tabela */}
        <div className="glass-card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-unifique-primary" />
              <span className="text-sm font-bold text-slate-700">{filtered.length} usuário{filtered.length !== 1 ? "s" : ""}</span>
            </div>
            <span className="text-xs text-slate-400">{totalAtivos} ativo{totalAtivos !== 1 ? "s" : ""}</span>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Usuário</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Perfil</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Cargo</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-400 text-sm">
                    <Loader2 className="animate-spin mx-auto mb-2" size={20} />
                    Carregando...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-400 text-sm">Nenhum usuário encontrado.</td>
                </tr>
              ) : filtered.map((u, idx) => {
                const cfg = PERFIL_CONFIG[u.perfil] ?? PERFIL_CONFIG.consultor;
                return (
                  <motion.tr
                    key={u.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className={cn("hover:bg-slate-50 transition-all", !u.ativo && "opacity-50")}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-unifique-primary to-unifique-cyan flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                          {u.avatar || initials(u.nome)}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-900">{u.nome}</p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={cn("inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold", cfg.bg, cfg.color)}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <span className="text-sm text-slate-600">{u.cargo || "—"}</span>
                    </td>
                    <td className="p-4 text-center">
                      <button onClick={() => toggleAtivo(u)} title={u.ativo ? "Desativar" : "Ativar"}>
                        {u.ativo
                          ? <CheckCircle size={18} className="text-emerald-500 mx-auto" />
                          : <XCircle size={18} className="text-slate-300 mx-auto" />}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => openEdit(u)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-unifique-primary transition-all"
                        title="Editar"
                      >
                        <Edit2 size={15} />
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,24,64,0.45)", backdropFilter: "blur(4px)" }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">
                {editId ? "Editar Usuário" : "Novo Usuário"}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-all">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <label className="block">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nome completo *</span>
                <input
                  type="text"
                  value={form.nome}
                  onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  placeholder="Ex: João Silva"
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all"
                  autoFocus
                />
              </label>

              <label className="block">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">E-mail *</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="usuario@redeunifique.com.br"
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all"
                />
              </label>

              <label className="block">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {editId ? "Nova senha (deixe em branco para manter)" : "Senha *"}
                </span>
                <input
                  type="password"
                  value={form.senha}
                  onChange={e => setForm(f => ({ ...f, senha: e.target.value }))}
                  placeholder="••••••••"
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Perfil de acesso</span>
                  <select
                    value={form.perfil}
                    onChange={e => setForm(f => ({ ...f, perfil: e.target.value as Perfil }))}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all bg-white"
                  >
                    <option value="admin">Admin</option>
                    <option value="gerente">Gerente</option>
                    <option value="consultor">Consultor</option>
                    <option value="preVenda">Pré-Venda</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cargo</span>
                  <input
                    type="text"
                    value={form.cargo}
                    onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))}
                    placeholder="Ex: Consultor Senior"
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all"
                  />
                </label>
              </div>

              {editId && (
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    onClick={() => setForm(f => ({ ...f, ativo: !f.ativo }))}
                    className={cn(
                      "w-10 h-6 rounded-full transition-colors relative",
                      form.ativo ? "bg-emerald-500" : "bg-slate-200"
                    )}
                  >
                    <div className={cn("absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all", form.ativo ? "left-5" : "left-1")} />
                  </div>
                  <span className="text-sm font-medium text-slate-700">Usuário ativo</span>
                </label>
              )}

              {erro && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">{erro}</div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-100">
              <button onClick={() => { setShowModal(false); setErro(""); }} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-unifique-primary text-white text-sm font-bold rounded-lg hover:bg-unifique-primary/90 disabled:opacity-60 transition-all"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {saving ? "Salvando..." : editId ? "Salvar alterações" : "Criar usuário"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </Shell>
  );
}
