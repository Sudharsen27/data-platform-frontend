"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Quarantine", href: "/quarantine" },
  { name: "Rules", href: "/rules" },
  { name: "Jobs", href: "/jobs" },
  { name: "Pipeline", href: "/pipeline" },
  { name: "Flow", href: "/flow" },
  { name: "Stewardship", href: "/stewardship" },
  { name: "Audit", href: "/audit" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full border-b border-zinc-200 bg-white px-4 py-5 md:h-screen md:w-64 md:border-b-0 md:border-r">
      <div className="mb-8 text-lg font-semibold text-zinc-900">MDM Governance</div>
      <nav className="flex gap-2 md:flex-col">
        {navItems.map((item) => (
          <Link
            key={item.name}
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
