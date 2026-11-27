"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { MOCK_PROFILES } from "@/lib/mock-data";
import { Profile, UserRole } from "@/types/database";

interface AuthContextValue {
  user: Profile | null;
  isLoading: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<{ ok: boolean; error?: string }>;
  loginAsRole: (role: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "smartattend_session_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      try {
        const saved =
          localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
        if (saved) {
          setUser(JSON.parse(saved) as Profile);
        }
      } catch {
        // Ignore storage errors
      } finally {
        setIsLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const persistUser = (profile: Profile | null, remember = true) => {
    setUser(profile);
    try {
      if (!profile) {
        localStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(STORAGE_KEY);
        return;
      }
      const serialized = JSON.stringify(profile);
      if (remember) {
        localStorage.setItem(STORAGE_KEY, serialized);
        sessionStorage.removeItem(STORAGE_KEY);
      } else {
        sessionStorage.setItem(STORAGE_KEY, serialized);
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Ignore storage errors
    }
  };

  const login = useCallback(
    async (email: string, password: string, remember = true) => {
      await new Promise((r) => setTimeout(r, 350));
      if (!email || !password || password.length < 4) {
        return { ok: false, error: "Please enter a valid email and password (min 4 characters)." };
      }

      const normalized = email.trim().toLowerCase();
      const matched =
        MOCK_PROFILES.find((p) => p.email.toLowerCase() === normalized) ??
        (normalized.includes("admin") ? MOCK_PROFILES[2] : MOCK_PROFILES[0]);

      persistUser(matched, remember);
      return { ok: true };
    },
    []
  );

  const loginAsRole = useCallback((role: UserRole) => {
    const profile =
      MOCK_PROFILES.find((p) => p.role === role) ?? MOCK_PROFILES[0];
    persistUser(profile, true);
  }, []);

  const logout = useCallback(() => {
    persistUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, loginAsRole, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
