"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useMobileNav } from "@/context/MobileNavContext";

const NAV_GROUPS = [
  {
    label: "Operate",
    items: [
      { name: "Dashboard", href: "/dashboard", short: "DB" },
      { name: "Quarantine", href: "/quarantine", short: "Q" },
      { name: "Stewardship", href: "/stewardship", short: "ST" },
      { name: "Master Data", href: "/master-data", short: "MD" },
      { name: "Duplicates", href: "/duplicates", short: "DP" },
    ],
  },
  {
    label: "Govern",
    items: [
      { name: "Catalog", href: "/catalog", short: "DC" },
      { name: "Lineage", href: "/lineage", short: "LN" },
      { name: "Audit", href: "/audit", short: "AU" },
      { name: "AI Activity", href: "/ai-activity", short: "AI" },
    ],
  },
  {
    label: "Platform",
    items: [
      { name: "Flow", href: "/flow", short: "FL" },
      { name: "Upload", href: "/upload", short: "UP" },
      { name: "Jobs", href: "/jobs", short: "JB" },
    ],
  },
];

const ADMIN_ITEMS = [
  { name: "Rules", href: "/rules", short: "RL" },
  { name: "Pipeline", href: "/pipeline", short: "PL" },
  { name: "Users", href: "/users", short: "US" },
];

function NavLink({ item, active, desktopCollapsed, onNavigate }) {
  return (
    <Link
      href={item.href}
      prefetch={false}
      onClick={onNavigate}
      title={desktopCollapsed ? item.name : undefined}
      className={`flex items-center gap-3 rounded-lg py-2 text-sm font-medium transition-colors ${
        desktopCollapsed ? "md:justify-center md:px-2" : "px-3"
      } ${
        active
          ? "bg-[var(--nav-active-bg)] text-[var(--nav-active-text)] shadow-sm ring-1 ring-[var(--nav-active-ring)]"
          : "text-[var(--text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--foreground)]"
      }`}
    >
      <span
        className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ${
          active ? "bg-[var(--nav-active-ring)] text-[var(--nav-active-text)]" : "bg-[var(--nav-icon-bg)] text-[var(--nav-icon-text)]"
        }`}
      >
        {item.short}
      </span>
      <span className={desktopCollapsed ? "md:sr-only" : ""}>{item.name}</span>
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { isAdmin } = useAuth();
  const { open, close, desktopCollapsed } = useMobileNav();

  const groups = isAdmin
    ? [
        NAV_GROUPS[0],
        { label: "Admin", items: ADMIN_ITEMS },
        ...NAV_GROUPS.slice(1),
      ]
    : NAV_GROUPS;

  return (
    <>
      <button
        type="button"
        className={`fixed inset-0 z-40 bg-[var(--overlay)] backdrop-blur-[1px] transition-opacity md:hidden ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={close}
        aria-hidden={!open}
        tabIndex={-1}
      />
      <aside
        className={`mdm-sidebar fixed inset-y-0 left-0 z-50 flex h-full w-[min(100vw-3rem,18rem)] max-w-[18rem] flex-col shadow-xl transition-[transform,width] duration-200 ease-out md:static md:z-auto md:h-auto md:min-h-screen md:max-w-none md:shrink-0 md:translate-x-0 md:self-stretch md:shadow-none ${
          open ? "translate-x-0" : "-translate-x-full"
        } ${desktopCollapsed ? "md:w-[4.5rem] md:min-w-[4.5rem]" : "md:w-72"}`}
      >
        <div
          className={`flex shrink-0 items-start justify-between gap-2 border-b border-[var(--border-subtle)] px-4 py-4 md:border-0 md:pt-6 ${desktopCollapsed ? "md:justify-center md:px-2" : "md:px-5"}`}
        >
          {desktopCollapsed ? (
            <div className="hidden md:flex md:w-full md:justify-center" aria-hidden>
              <span className="mdm-sidebar-logo">M</span>
            </div>
          ) : (
            <div className="mdm-sidebar-brand min-w-0">
              <span className="mdm-sidebar-logo">M</span>
              <div>
                <p className="text-sm font-semibold leading-snug">MDM Governance</p>
                <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                  Data platform
                </p>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={close}
            className="mdm-icon-btn shrink-0 md:hidden"
            aria-label="Close menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav
          className={`flex flex-col gap-4 px-3 py-3 md:flex-1 md:overflow-y-auto md:py-4 ${desktopCollapsed ? "md:px-2" : "md:px-4"}`}
        >
          {groups.map((group) => (
            <div key={group.label}>
              {!desktopCollapsed ? (
                <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-subtle)]">
                  {group.label}
                </p>
              ) : null}
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    active={pathname === item.href}
                    desktopCollapsed={desktopCollapsed}
                    onNavigate={close}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
