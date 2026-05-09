"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useMobileNav } from "@/context/MobileNavContext";

const BASE_NAV = [
  { name: "Dashboard", href: "/dashboard", short: "DB" },
  { name: "Quarantine", href: "/quarantine", short: "Q" },
  { name: "Catalog", href: "/catalog", short: "DC" },
  { name: "Lineage", href: "/lineage", short: "LN" },
  { name: "Jobs", href: "/jobs", short: "JB" },
  { name: "Flow", href: "/flow", short: "FL" },
  { name: "Stewardship", href: "/stewardship", short: "ST" },
  { name: "Audit", href: "/audit", short: "AU" },
];

const ADMIN_ONLY = [
  { name: "Rules", href: "/rules", short: "RL" },
  { name: "Pipeline", href: "/pipeline", short: "PL" },
  { name: "Users", href: "/users", short: "US" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isAdmin } = useAuth();
  const { open, close, desktopCollapsed } = useMobileNav();

  const navItems = isAdmin ? [...BASE_NAV.slice(0, 2), ...ADMIN_ONLY, ...BASE_NAV.slice(2)] : BASE_NAV;

  return (
    <>
      <button
        type="button"
        className={`fixed inset-0 z-40 bg-zinc-900/40 backdrop-blur-[1px] transition-opacity md:hidden ${
          open ? "opacity-100 pointer-events-auto" : "pointer-events-none opacity-0"
        }`}
        onClick={close}
        aria-hidden={!open}
        tabIndex={-1}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full w-[min(100vw-3rem,18rem)] max-w-[18rem] flex-col border-r border-zinc-200 bg-white shadow-xl transition-[transform,width] duration-200 ease-out md:static md:z-auto md:h-auto md:min-h-screen md:max-w-none md:shrink-0 md:translate-x-0 md:self-stretch md:shadow-none ${
          open ? "translate-x-0" : "-translate-x-full"
        } ${desktopCollapsed ? "md:w-[4.5rem] md:min-w-[4.5rem]" : "md:w-72"}`}
      >
        <div
          className={`flex shrink-0 items-start justify-between gap-2 border-b border-zinc-100 px-4 py-4 md:border-0 md:pt-6 ${desktopCollapsed ? "md:justify-center md:px-2" : "md:px-5"}`}
        >
          {desktopCollapsed ? (
            <div className="hidden min-w-0 md:flex md:w-full md:justify-center" aria-hidden>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-[11px] font-bold text-white">
                M
              </span>
            </div>
          ) : null}
          <div className={`min-w-0 ${desktopCollapsed ? "md:hidden" : ""}`}>
            <p className="text-base font-semibold leading-snug text-zinc-900">MDM Governance</p>
            <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
              Control Center
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 md:hidden"
            aria-label="Close menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav
          className={`flex flex-col gap-1 px-3 py-3 md:flex-1 md:overflow-y-auto md:py-4 ${desktopCollapsed ? "md:px-2" : "md:px-4"}`}
        >
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                onClick={close}
                title={desktopCollapsed ? item.name : undefined}
                className={`flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition-colors ${
                  desktopCollapsed ? "md:justify-center md:px-2" : "px-3"
                } ${
                  active
                    ? "bg-blue-50 text-blue-800 shadow-sm ring-1 ring-blue-100"
                    : "text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
                }`}
              >
                <span
                  className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ${
                    active ? "bg-blue-100 text-blue-800" : "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  {item.short}
                </span>
                <span className={desktopCollapsed ? "md:sr-only" : ""}>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
