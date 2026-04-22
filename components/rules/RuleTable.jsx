import Button from "@/components/ui/Button";

export default function RuleTable({
  rules,
  onEdit,
  onDelete,
  deletingId = null,
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">ID</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
              Field
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">Rule</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {rules.map((ruleItem) => (
            <tr key={ruleItem.id} className="border-b border-zinc-100 hover:bg-zinc-50/70">
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
                  <Button
                    onClick={() => onEdit(ruleItem)}
                    variant="secondary"
                    size="sm"
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={() => onDelete(ruleItem.id)}
                    disabled={deletingId === ruleItem.id}
                    variant="danger"
                    size="sm"
                  >
                    {deletingId === ruleItem.id ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
