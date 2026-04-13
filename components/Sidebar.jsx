import Link from "next/link";

const menuItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Quarantine", href: "#" },
  { label: "Rules", href: "#" },
];

export default function Sidebar() {
  return (
    <aside className="w-full border-b border-zinc-200 bg-white px-4 py-4 md:h-screen md:w-64 md:border-b-0 md:border-r">
      <div className="mb-6 text-lg font-semibold text-zinc-900">
        MDM Governance
      </div>
      <nav className="flex gap-2 md:flex-col">
        {menuItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
