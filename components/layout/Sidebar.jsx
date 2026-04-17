import Link from "next/link";

const navItems = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Quarantine", href: "/quarantine" },
  { name: "Rules", href: "/rules" },
  { name: "Jobs", href: "/jobs" },
  { name: "Audit", href: "/audit" },
];

export default function Sidebar() {
  return (
    <aside className="w-full border-b border-zinc-200 bg-white px-4 py-5 md:h-screen md:w-64 md:border-b-0 md:border-r">
      <div className="mb-8 text-lg font-semibold text-zinc-900">MDM Governance</div>
      <nav className="flex gap-2 md:flex-col">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
          >
            {item.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
