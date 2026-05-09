"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

const STORAGE_KEY = "mdm-sidebar-desktop-collapsed";

const sidebarListeners = new Set();

function subscribeSidebar(onStoreChange) {
  const handler = (e) => {
    if (e.key === STORAGE_KEY || e.key === null) onStoreChange();
  };
  window.addEventListener("storage", handler);
  sidebarListeners.add(onStoreChange);
  return () => {
    window.removeEventListener("storage", handler);
    sidebarListeners.delete(onStoreChange);
  };
}

function emitSidebar() {
  sidebarListeners.forEach((l) => l());
}

function getDesktopCollapsedSnapshot() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

const getServerDesktopCollapsedSnapshot = () => false;

const MobileNavContext = createContext(null);

export function MobileNavProvider({ children }) {
  const [open, setOpen] = useState(false);
  const desktopCollapsed = useSyncExternalStore(
    subscribeSidebar,
    getDesktopCollapsedSnapshot,
    getServerDesktopCollapsedSnapshot
  );

  const close = useCallback(() => setOpen(false), []);
  const openNav = useCallback(() => setOpen(true), []);

  const toggleDesktopCollapsed = useCallback(() => {
    try {
      const cur = getDesktopCollapsedSnapshot();
      localStorage.setItem(STORAGE_KEY, cur ? "0" : "1");
    } catch {
      // ignore
    }
    emitSidebar();
  }, []);

  const value = useMemo(
    () => ({
      open,
      setOpen,
      close,
      openNav,
      desktopCollapsed,
      toggleDesktopCollapsed,
    }),
    [open, close, openNav, desktopCollapsed, toggleDesktopCollapsed]
  );

  return <MobileNavContext.Provider value={value}>{children}</MobileNavContext.Provider>;
}

export function useMobileNav() {
  const ctx = useContext(MobileNavContext);
  if (!ctx) {
    throw new Error("useMobileNav must be used within MobileNavProvider");
  }
  return ctx;
}
