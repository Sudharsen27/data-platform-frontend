export default function Navbar({ title = "Dashboard" }) {
  return (
    <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4">
      <h1 className="text-xl font-semibold text-zinc-900">{title}</h1>
      <div className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-700">
        Admin
      </div>
    </header>
  );
}
