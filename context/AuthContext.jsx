"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  SESSION_PRESENCE_COOKIE,
  SESSION_PRESENCE_MAX_AGE,
  TOKEN_KEY,
} from "@/lib/authConstants";

const AuthContext = createContext(null);

function decodeJwtPayload(token) {
  try {
    const [, payload] = token.split(".");
    if (!payload) {
      return null;
    }
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function setSessionPresenceCookie() {
  if (typeof document === "undefined") {
    return;
  }
  document.cookie = `${SESSION_PRESENCE_COOKIE}=1; Path=/; Max-Age=${SESSION_PRESENCE_MAX_AGE}; SameSite=Lax`;
}

function clearSessionPresenceCookie() {
  if (typeof document === "undefined") {
    return;
  }
  document.cookie = `${SESSION_PRESENCE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    setToken(stored);
    if (stored) {
      setSessionPresenceCookie();
    } else {
      clearSessionPresenceCookie();
    }
    setIsReady(true);
  }, []);

  function login(nextToken) {
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, nextToken);
      setSessionPresenceCookie();
    }
    setToken(nextToken);
  }

  function logout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
      clearSessionPresenceCookie();
    }
    setToken(null);
  }

  const value = useMemo(() => {
    const payload = token ? decodeJwtPayload(token) : null;
    const userEmail = payload?.sub || "";
    const userRole = String(payload?.role || "user").toLowerCase();
    const isAdmin = userRole === "admin";
    const isActive = payload?.active !== false;
    const userName =
      (typeof payload?.name === "string" && payload.name) ||
      (userEmail ? userEmail.split("@")[0] : "");

    return {
      token,
      isReady,
      isAuthenticated: Boolean(token),
      userEmail,
      userName,
      userRole,
      isAdmin,
      isActive,
      login,
      logout,
    };
  }, [token, isReady]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
