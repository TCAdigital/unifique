"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

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

const USERS: Record<string, { password: string; user: AuthUser }> = {
  "tadeu.alves@redeunifique.com.br": {
    password: "unifique@2026",
    user: { id: "a1000000-0000-0000-0000-000000000001", nome: "Tadeu Alves", email: "tadeu.alves@redeunifique.com.br", perfil: "admin", avatar: "TA" },
  },
  "maria.souza@redeunifique.com.br": {
    password: "unifique@2026",
    user: { id: "a1000000-0000-0000-0000-000000000002", nome: "Maria Souza", email: "maria.souza@redeunifique.com.br", perfil: "gerente", avatar: "MS" },
  },
  "joao.silva@redeunifique.com.br": {
    password: "unifique@2026",
    user: { id: "a1000000-0000-0000-0000-000000000003", nome: "João Silva", email: "joao.silva@redeunifique.com.br", perfil: "consultor", avatar: "JS" },
  },
};

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
    const entry = USERS[email.toLowerCase()];
    if (!entry || entry.password !== password) return false;
    localStorage.setItem(AUTH_KEY, JSON.stringify(entry.user));
    setUser(entry.user);
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
