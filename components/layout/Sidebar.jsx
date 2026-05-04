"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const BASE_NAV = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Quarantine", href: "/quarantine" },
  { name: "Jobs", href: "/jobs" },
  { name: "Flow", href: "/flow" },
  { name: "Stewardship", href: "/stewardship" },
  { name: "Audit", href: "/audit" },
];

const ADMIN_ONLY = [
  { name: "Rules", href: "/rules" },
  { name: "Pipeline", href: "/pipeline" },
  { name: "Users", href: "/users" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isAdmin } = useAuth();

  const navItems = isAdmin ? [...BASE_NAV.slice(0, 2), ...ADMIN_ONLY, ...BASE_NAV.slice(2)] : BASE_NAV;

  return (
    <aside className="w-full border-b border-zinc-200 bg-white px-4 py-5 md:h-screen md:w-64 md:border-b-0 md:border-r">
      <div className="mb-8 text-lg font-semibold text-zinc-900">MDM Governance</div>
      <nav className="flex gap-2 md:flex-col">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              pathname === item.href
                ? "bg-blue-50 text-blue-700"
                : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
            }`}
          >
            {item.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
