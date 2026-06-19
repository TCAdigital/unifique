"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface AuthUser {
  id: string;
  nome: string;
  email: string;
  perfil: "admin" | "gerente" | "consultor" | "preVenda";
  avatar: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: async () => false,
  logout: () => {},
});

// Só o e-mail fica no localStorage como token de sessão.
// O perfil completo é sempre buscado do banco.
const SESSION_KEY = "unifique_session";

async function buscarPerfil(email: string): Promise<AuthUser | null> {
  const { data } = await supabase
    .from("usuarios")
    .select("id, nome, email, perfil, avatar")
    .eq("email", email.toLowerCase().trim())
    .eq("ativo", true)
    .single();
  if (!data) return null;
  return {
    id: data.id,
    nome: data.nome,
    email: data.email,
    perfil: data.perfil as AuthUser["perfil"],
    avatar: data.avatar ?? data.nome.slice(0, 2).toUpperCase(),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const sessionEmail = localStorage.getItem(SESSION_KEY);
    if (sessionEmail) {
      // Perfil sempre vem do banco — se o usuário for desativado, sai automaticamente
      buscarPerfil(sessionEmail).then((perfil) => {
        setUser(perfil);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && !user && pathname !== "/login") {
      router.replace("/login");
    }
  }, [user, loading, pathname, router]);

  async function login(email: string, password: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("usuarios")
      .select("id, nome, email, perfil, avatar, password_hash")
      .eq("email", email.toLowerCase().trim())
      .eq("ativo", true)
      .single();

    if (error || !data) return false;
    if (data.password_hash !== password) return false;

    const perfil: AuthUser = {
      id: data.id,
      nome: data.nome,
      email: data.email,
      perfil: data.perfil as AuthUser["perfil"],
      avatar: data.avatar ?? data.nome.slice(0, 2).toUpperCase(),
    };

    localStorage.setItem(SESSION_KEY, data.email);
    setUser(perfil);
    router.replace("/");
    return true;
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
    router.replace("/login");
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
