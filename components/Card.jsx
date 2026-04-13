export default function Card({ title, value, subtitle }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <p className="text-sm font-medium text-zinc-500">{title}</p>
      <p className="mt-3 text-3xl font-semibold text-zinc-900">{value}</p>
      {subtitle ? <p className="mt-2 text-sm text-zinc-500">{subtitle}</p> : null}
    </div>
  );
}
