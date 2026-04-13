export default function RuleTable({
  rules,
  onEdit,
  onDelete,
  deletingId = null,
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-zinc-200 text-sm">
        <thead className="bg-zinc-50">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-zinc-600">ID</th>
            <th className="px-4 py-3 text-left font-semibold text-zinc-600">
              Field
            </th>
            <th className="px-4 py-3 text-left font-semibold text-zinc-600">Rule</th>
            <th className="px-4 py-3 text-left font-semibold text-zinc-600">
              Status
            </th>
            <th className="px-4 py-3 text-left font-semibold text-zinc-600">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {rules.map((ruleItem) => (
            <tr key={ruleItem.id}>
              <td className="px-4 py-3 font-medium text-zinc-800">{ruleItem.id}</td>
              <td className="px-4 py-3 font-medium text-zinc-800">
                {ruleItem.field}
              </td>
              <td className="px-4 py-3 text-zinc-700">{ruleItem.rule}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                    ruleItem.status === "active"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  {ruleItem.status}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(ruleItem)}
                    className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(ruleItem.id)}
                    disabled={deletingId === ruleItem.id}
                    className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deletingId === ruleItem.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
