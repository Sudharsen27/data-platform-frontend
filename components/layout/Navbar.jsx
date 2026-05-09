"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useMobileNav } from "@/context/MobileNavContext";
import Button from "@/components/ui/Button";

export default function Navbar({ title = "Dashboard" }) {
  const router = useRouter();
  const { logout, userEmail, userRole, isAdmin } = useAuth();
  const { openNav, open, desktopCollapsed, toggleDesktopCollapsed } = useMobileNav();

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  const roleLabel = isAdmin ? "Admin" : "User";

  return (
    <header className="sticky top-0 z-30 flex flex-col gap-3 border-b border-zinc-200/80 bg-white/95 px-4 py-3 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-white/80 sm:px-6 sm:py-4 md:flex-row md:items-center md:justify-between">
      <div className="flex min-w-0 items-start gap-2 md:flex-1 md:gap-3">
        <button
          type="button"
          onClick={openNav}
          className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 shadow-sm md:hidden"
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
          className="mt-0.5 hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 shadow-sm md:flex"
          aria-label={desktopCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!desktopCollapsed}
          title={desktopCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {desktopCollapsed ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 5l7 7-7 7M5 5l7 7-7 7"
              />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
              />
            </svg>
          )}
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-semibold tracking-tight text-zinc-900 sm:text-xl">{title}</h1>
          {userEmail ? (
            <p className="mt-1 truncate text-xs font-medium text-zinc-500">
              {roleLabel}: {userEmail}
              {userRole ? (
                <span className="ml-2 inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-600">
                  {userRole}
                </span>
              ) : null}
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex w-full items-center gap-3 pl-[52px] md:w-auto md:min-w-0 md:justify-end md:pl-0">
        <Button type="button" variant="secondary" onClick={handleLogout} className="shrink-0">
          Logout
        </Button>
      </div>
    </header>
  );
}
