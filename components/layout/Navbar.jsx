"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useMobileNav } from "@/context/MobileNavContext";
import ThemeToggle from "@/components/layout/ThemeToggle";

export default function Navbar({ title = "Dashboard" }) {
  const router = useRouter();
  const { logout, userEmail, userRole, isAdmin, userName } = useAuth();
  const { openNav, open, desktopCollapsed, toggleDesktopCollapsed } = useMobileNav();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  const roleLabel = isAdmin ? "Admin" : "User";
  const displayName = (userName || "").trim() || userEmail || "Profile";
  const initials = (() => {
    const source = displayName.trim();
    if (!source) return "U";
    const parts = source.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
    }
    return source.slice(0, 2).toUpperCase();
  })();

  useEffect(() => {
    function onClickOutside(event) {
      if (!menuRef.current || menuRef.current.contains(event.target)) {
        return;
      }
      setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <header className="mdm-navbar flex flex-col gap-3 px-4 py-3 sm:px-6 sm:py-4 md:flex-row md:items-center md:justify-between">
      <div className="flex min-w-0 items-start gap-2 md:flex-1 md:gap-3">
        <button
          type="button"
          onClick={openNav}
          className="mdm-icon-btn mt-0.5 md:hidden"
          aria-label="Open menu"
          aria-expanded={open}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <button
          type="button"
          onClick={toggleDesktopCollapsed}
          className="mdm-icon-btn mt-0.5 hidden md:inline-flex"
          aria-label={desktopCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!desktopCollapsed}
        >
          {desktopCollapsed ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          )}
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-semibold tracking-tight sm:text-xl">{title}</h1>
          {userEmail ? (
            <p className="mt-1 truncate text-xs text-[var(--text-muted)]">
              {roleLabel}: {userEmail}
              {userRole ? (
                <span className="ml-2 inline-flex rounded-full bg-[var(--color-primary-muted)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-primary)]">
                  {userRole}
                </span>
              ) : null}
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex w-full items-center gap-2 pl-[52px] md:w-auto md:justify-end md:pl-0">
        <ThemeToggle />
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            className="inline-flex max-w-[220px] items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--color-surface-elevated)] px-2.5 py-1.5 text-xs font-medium text-[var(--foreground)] shadow-sm transition hover:bg-[var(--color-surface-hover)]"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-muted)] text-[10px] font-semibold text-[var(--color-primary)]">
              {initials}
            </span>
            <span className="hidden truncate sm:inline">{displayName}</span>
          </button>
          {menuOpen ? (
            <div className="absolute right-0 z-30 mt-2 w-72 overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--color-surface-elevated)] shadow-2xl ring-1 ring-black/5 backdrop-blur-sm">
              <div className="px-4 py-3">
                <p className="truncate text-base font-semibold text-[var(--foreground)]">{displayName}</p>
                <p className="truncate text-sm text-[var(--text-muted)]">{userEmail}</p>
                <span className="mt-2 inline-flex rounded-full bg-[var(--color-primary-muted)] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-primary)]">
                  {userRole || roleLabel}
                </span>
              </div>
              <div className="h-px bg-[var(--border-subtle)]" />
              <div className="p-2">
                <Link
                  href="/profile"
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--color-surface-hover)]"
                  onClick={() => setMenuOpen(false)}
                >
                  Edit profile
                </Link>
                {isAdmin ? (
                  <Link
                    href="/users"
                    className="mt-0.5 block rounded-lg px-3 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--color-surface-hover)]"
                    onClick={() => setMenuOpen(false)}
                  >
                    Manage users
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-1 block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50 dark:hover:bg-rose-950/20"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
