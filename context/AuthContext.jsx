"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  REFRESH_TOKEN_KEY,
  SESSION_PRESENCE_COOKIE,
  SESSION_PRESENCE_MAX_AGE,
  TOKEN_KEY,
} from "@/lib/authConstants";

const AuthContext = createContext(null);
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const ROLE_PERMISSIONS = {
  admin: [
    "dashboard:read",
    "lineage:read",
    "rules:read",
    "rules:write",
    "pipeline:run",
    "users:manage",
    "audit:read",
    "stewardship:manage",
  ],
  user: ["dashboard:read", "lineage:read", "rules:read", "audit:read"],
};

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
  const [refreshToken, setRefreshToken] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const stored = localStorage.getItem(TOKEN_KEY);
    const storedRefresh = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (stored) {
      setSessionPresenceCookie();
    } else {
      clearSessionPresenceCookie();
    }
    Promise.resolve().then(() => {
      setToken(stored || null);
      setRefreshToken(storedRefresh || null);
      setIsReady(true);
    });
  }, []);

  const refreshAccessToken = useCallback(async () => {
    if (!refreshToken) {
      return null;
    }
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!response.ok) {
      throw new Error("Session expired. Please login again.");
    }
    const data = await response.json();
    setToken(data.access_token || null);
    if (typeof window !== "undefined" && data.access_token) {
      localStorage.setItem(TOKEN_KEY, data.access_token);
      setSessionPresenceCookie();
    }
    return data.access_token || null;
  }, [refreshToken]);

  useEffect(() => {
    if (!token || !refreshToken) {
      return;
    }
    const payload = decodeJwtPayload(token);
    const now = Math.floor(Date.now() / 1000);
    const exp = Number(payload?.exp || 0);
    if (!exp || exp - now > 120) {
      return;
    }
    const timerId = window.setTimeout(() => {
      refreshAccessToken().catch(() => {
        if (typeof window !== "undefined") {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
        }
        clearSessionPresenceCookie();
        setToken(null);
        setRefreshToken(null);
      });
    }, 0);
    return () => window.clearTimeout(timerId);
  }, [token, refreshToken, refreshAccessToken]);

  function login(nextToken, nextRefreshToken = null) {
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, nextToken);
      if (nextRefreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, nextRefreshToken);
      }
      setSessionPresenceCookie();
    }
    setToken(nextToken);
    if (nextRefreshToken) {
      setRefreshToken(nextRefreshToken);
    }
  }

  function logout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      clearSessionPresenceCookie();
    }
    setToken(null);
    setRefreshToken(null);
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

    const permissions = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS.user;

    return {
      token,
      refreshToken,
      isReady,
      isAuthenticated: Boolean(token),
      userEmail,
      userName,
      userRole,
      isAdmin,
      permissions,
      isActive,
      login,
      logout,
      refreshAccessToken,
    };
  }, [token, refreshToken, isReady, refreshAccessToken]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
