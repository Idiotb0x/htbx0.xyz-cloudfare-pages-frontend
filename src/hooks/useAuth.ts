"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let storedToken: string | null = null;
    let storedUser: string | null = null;
    try {
      storedToken = localStorage.getItem("token");
      storedUser = localStorage.getItem("user");
      if (!storedToken || !storedUser) {
        router.replace("/login");
        return;
      }
      const payload = JSON.parse(atob(storedToken.split(".")[1]));
      if (payload.exp * 1000 < Date.now()) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.replace("/login");
        return;
      }
      const parsedUser = JSON.parse(storedUser) as AuthUser;
      queueMicrotask(() => {
        setToken(storedToken);
        setUser(parsedUser);
        setReady(true);
      });
    } catch {
      if (storedToken || storedUser) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
      router.replace("/login");
    }
  }, [router]);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  }, [router]);

  return {
    user,
    token,
    ready,
    isAuthenticated: !!token,
    isAdmin: user?.role === "admin",
    logout,
  };
}
