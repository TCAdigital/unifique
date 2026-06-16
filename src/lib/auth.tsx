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

const AUTH_KEY = "unifique_auth_user";

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: async () => false,
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const stored = localStorage.getItem(AUTH_KEY);
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem(AUTH_KEY);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading && !user && pathname !== "/login") {
      router.replace("/login");
    }
  }, [user, loading, pathname, router]);

  async function login(email: string, password: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("usuarios")
      .select("id, nome, email, perfil, avatar, ativo, password_hash")
      .eq("email", email.toLowerCase().trim())
      .eq("ativo", true)
      .single();

    if (error || !data) return false;
    if (data.password_hash !== password) return false;

    const authUser: AuthUser = {
      id: data.id,
      nome: data.nome,
      email: data.email,
      perfil: data.perfil as AuthUser["perfil"],
      avatar: data.avatar ?? data.nome.slice(0, 2).toUpperCase(),
    };

    localStorage.setItem(AUTH_KEY, JSON.stringify(authUser));
    setUser(authUser);
    router.replace("/");
    return true;
  }

  function logout() {
    localStorage.removeItem(AUTH_KEY);
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
