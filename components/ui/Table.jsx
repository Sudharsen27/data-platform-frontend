import EmptyState from "@/components/ui/EmptyState";

export function Table({
  columns,
  data,
  emptyMessage = "No data available.",
  renderRow,
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search table",
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
      {typeof onSearchChange === "function" ? (
        <div className="border-b border-zinc-200 p-3">
          <input
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      ) : null}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td className="px-4 py-6" colSpan={columns.length}>
                <EmptyState title="No results" description={emptyMessage} />
              </td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr key={item.id ?? index} className="border-b border-zinc-100 align-top hover:bg-zinc-50/80">
                {renderRow(item)}
              </tr>
            ))
          )}
        </tbody>
        </table>
      </div>
    </div>
  );
}
