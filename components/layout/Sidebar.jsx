"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const BASE_NAV = [
  { name: "Dashboard", href: "/dashboard", short: "DB" },
  { name: "Quarantine", href: "/quarantine", short: "Q" },
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

  const navItems = isAdmin ? [...BASE_NAV.slice(0, 2), ...ADMIN_ONLY, ...BASE_NAV.slice(2)] : BASE_NAV;

  return (
    <aside className="w-full border-b border-zinc-200 bg-white px-4 py-5 md:h-screen md:w-72 md:border-b-0 md:border-r">
      <div className="mb-8">
        <p className="text-lg font-semibold text-zinc-900">MDM Governance Control Center</p>
        <p className="mt-1 text-xs text-zinc-500">Enterprise Data Governance Platform</p>
      </div>
      <nav className="flex gap-2 md:flex-col">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              pathname === item.href
                ? "bg-blue-50 text-blue-700"
                : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
            }`}
          >
            <span
              className={`inline-flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-semibold ${
                pathname === item.href
                  ? "bg-blue-100 text-blue-700"
                  : "bg-zinc-100 text-zinc-600"
              }`}
            >
              {item.short}
            </span>
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
