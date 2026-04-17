"use client";

import { createContext, useContext, useMemo, useState } from "react";

const TOKEN_KEY = "mdm_auth_token";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    if (typeof window === "undefined") {
      return null;
    }
    return localStorage.getItem(TOKEN_KEY);
  });
  const isReady = true;

  function login(nextToken) {
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, nextToken);
    }
    setToken(nextToken);
  }

  function logout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
    }
    setToken(null);
  }

  const value = useMemo(
    () => ({
      token,
      isReady,
      isAuthenticated: Boolean(token),
      login,
      logout,
    }),
    [token, isReady]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
