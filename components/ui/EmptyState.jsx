export default function EmptyState({ title = "No data", description = "No records available right now." }) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-6 py-10 text-center">
      <p className="text-sm font-semibold text-zinc-800">{title}</p>
      <p className="mt-2 text-sm text-zinc-500">{description}</p>
    </div>
  );
}
