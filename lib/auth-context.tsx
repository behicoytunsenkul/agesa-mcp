"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AUTH_REMEMBER_KEY,
  AUTH_STORAGE_KEY,
  type AuthPayload,
  validateCredentials,
} from "./auth";

type AuthContextValue = {
  ready: boolean;
  authenticated: boolean;
  email: string | null;
  login: (
    email: string,
    password: string,
    remember: boolean
  ) => { ok: true } | { ok: false; error: string };
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredAuth(): AuthPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const remembered = localStorage.getItem(AUTH_REMEMBER_KEY) === "1";
    const raw = remembered
      ? localStorage.getItem(AUTH_STORAGE_KEY)
      : sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthPayload;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [payload, setPayload] = useState<AuthPayload | null>(null);

  useEffect(() => {
    setPayload(readStoredAuth());
    setReady(true);
  }, []);

  const login = useCallback(
    (email: string, password: string, remember: boolean) => {
      if (!validateCredentials(email, password)) {
        return { ok: false as const, error: "E-posta veya şifre hatalı." };
      }
      const next: AuthPayload = {
        email: email.trim().toLowerCase(),
        loggedInAt: new Date().toISOString(),
      };
      localStorage.removeItem(AUTH_STORAGE_KEY);
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(AUTH_REMEMBER_KEY);

      if (remember) {
        localStorage.setItem(AUTH_REMEMBER_KEY, "1");
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(next));
      } else {
        sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(next));
      }
      setPayload(next);
      return { ok: true as const };
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(AUTH_REMEMBER_KEY);
    setPayload(null);
  }, []);

  const value = useMemo(
    () => ({
      ready,
      authenticated: !!payload,
      email: payload?.email ?? null,
      login,
      logout,
    }),
    [ready, payload, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
