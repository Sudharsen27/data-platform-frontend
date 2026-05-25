"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

export const THEME_STORAGE_KEY = "mdm-theme";

/** @typedef {"light" | "dark"} ThemeMode */

const themeListeners = new Set();

function subscribeTheme(onStoreChange) {
  const handler = (e) => {
    if (e.key === THEME_STORAGE_KEY || e.key === null) onStoreChange();
  };
  window.addEventListener("storage", handler);
  themeListeners.add(onStoreChange);
  return () => {
    window.removeEventListener("storage", handler);
    themeListeners.delete(onStoreChange);
  };
}

function emitTheme() {
  themeListeners.forEach((l) => l());
}

function getStoredMode() {
  try {
    if (localStorage.getItem(THEME_STORAGE_KEY) === "dark") return "dark";
  } catch {
    // ignore
  }
  return "light";
}

function applyDomTheme(mode) {
  const root = document.documentElement;
  root.classList.toggle("dark", mode === "dark");
  root.style.colorScheme = mode;
}

function getModeSnapshot() {
  return getStoredMode();
}

const getServerModeSnapshot = () => "light";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const mode = useSyncExternalStore(subscribeTheme, getModeSnapshot, getServerModeSnapshot);

  useEffect(() => {
    applyDomTheme(mode);
  }, [mode]);

  const toggleTheme = useCallback(() => {
    const next = mode === "dark" ? "light" : "dark";
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // ignore
    }
    emitTheme();
    applyDomTheme(next);
  }, [mode]);

  const value = useMemo(
    () => ({ mode, toggleTheme, isDark: mode === "dark" }),
    [mode, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
