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
    // onAuthStateChange dispara INITIAL_SESSION no mount com a sessão atual (se houver).
    // Supabase gerencia o token internamente — sem localStorage no nosso código.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user?.email) {
          const perfil = await buscarPerfil(session.user.email);
          setUser(perfil);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading && !user && pathname !== "/login") {
      router.replace("/login");
    }
  }, [user, loading, pathname, router]);

  async function login(email: string, password: string): Promise<boolean> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return false;
    const perfil = await buscarPerfil(email);
    if (!perfil) {
      await supabase.auth.signOut();
      return false;
    }
    setUser(perfil);
    router.replace("/");
    return true;
  }

  function logout() {
    supabase.auth.signOut();
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
