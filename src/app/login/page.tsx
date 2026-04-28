"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Eye, EyeOff, Loader2, AlertCircle, Wifi } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setErro("");
    setLoading(true);
    const ok = await login(email, password);
    if (!ok) {
      setErro("E-mail ou senha inválidos. Verifique suas credenciais.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: "linear-gradient(135deg, #001840 0%, #0057B8 60%, #00A3E0 100%)" }}>

      {/* Lado esquerdo — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-16 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
            <span className="text-unifique-primary font-bold text-lg">U</span>
          </div>
          <span className="font-bold text-2xl tracking-tight">unifique</span>
        </div>

        <div>
          <h1 className="text-5xl font-bold leading-tight mb-6" style={{ fontFamily: "var(--font-outfit)" }}>
            Plataforma de<br />Negócios TIC<br />
            <span style={{ color: "#00C8F0" }}>& IA</span>
          </h1>
          <p className="text-white/70 text-lg leading-relaxed max-w-md">
            CRM, Pipeline, OKR e Integrações em uma única ferramenta para a equipe comercial da Rede Unifique.
          </p>

          <div className="grid grid-cols-3 gap-4 mt-12">
            {[
              { label: "Módulos", value: "12+" },
              { label: "Integrações", value: "3" },
              { label: "Uptime", value: "99.9%" },
            ].map((s) => (
              <div key={s.label} className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}>
                <p className="text-2xl font-bold" style={{ color: "#00C8F0" }}>{s.value}</p>
                <p className="text-white/60 text-sm mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 text-white/40 text-sm">
          <Wifi size={14} />
          <span>Rede Unifique · Sistema Interno</span>
        </div>
      </div>

      {/* Lado direito — formulário */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-8" style={{ boxShadow: "0 25px 60px rgba(0,24,64,0.35)" }}>

            {/* Mobile logo */}
            <div className="flex lg:hidden items-center gap-2 mb-8">
              <div className="w-8 h-8 bg-unifique-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">U</span>
              </div>
              <span className="font-bold text-xl text-unifique-dark">unifique</span>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-unifique-dark" style={{ fontFamily: "var(--font-outfit)" }}>
                Bem-vindo de volta
              </h2>
              <p className="text-unifique-text-sec text-sm mt-1">
                Acesse com sua conta corporativa Rede Unifique
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-unifique-text-sec mb-1.5 uppercase tracking-wider">
                  E-mail corporativo
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nome@redeunifique.com.br"
                  autoComplete="email"
                  className="w-full px-4 py-3 rounded-xl text-sm text-unifique-dark border outline-none transition-all"
                  style={{
                    background: "#EEF5FF",
                    border: "1.5px solid #C5D8F0",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#0057B8")}
                  onBlur={(e) => (e.target.style.borderColor = "#C5D8F0")}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-unifique-text-sec mb-1.5 uppercase tracking-wider">
                  Senha
                </label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    className="w-full px-4 py-3 pr-11 rounded-xl text-sm text-unifique-dark border outline-none transition-all"
                    style={{
                      background: "#EEF5FF",
                      border: "1.5px solid #C5D8F0",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#0057B8")}
                    onBlur={(e) => (e.target.style.borderColor = "#C5D8F0")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-unifique-text-muted hover:text-unifique-primary transition-colors"
                  >
                    {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {erro && (
                <div className="flex items-center gap-2 p-3 rounded-xl text-sm text-red-600" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
                  <AlertCircle size={15} className="flex-shrink-0" />
                  {erro}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition-all disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #0057B8, #00A3E0)" }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" /> Entrando...
                  </span>
                ) : (
                  "Entrar na Plataforma"
                )}
              </button>

              <div className="relative flex items-center gap-3 py-1">
                <div className="flex-1 h-px" style={{ background: "#E2EEF9" }} />
                <span className="text-xs text-unifique-text-muted">ou</span>
                <div className="flex-1 h-px" style={{ background: "#E2EEF9" }} />
              </div>

              <button
                type="button"
                className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-3 transition-all hover:opacity-90"
                style={{ background: "#F3F4F6", border: "1.5px solid #E5E7EB", color: "#374151" }}
              >
                <svg width="18" height="18" viewBox="0 0 21 21">
                  <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
                  <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
                  <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
                  <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
                </svg>
                Entrar com Microsoft 365
              </button>
            </form>

            <p className="text-center text-[11px] text-unifique-text-muted mt-6">
              Acesso restrito à equipe Rede Unifique ·{" "}
              <a href="mailto:suporte@redeunifique.com.br" className="text-unifique-primary hover:underline">
                Suporte
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
