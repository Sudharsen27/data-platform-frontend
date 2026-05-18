import EditableCell from "@/components/table/EditableCell";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";

export default function DataTable({
  rows,
  onFieldChange,
  onSave,
  onExplain,
  explainingId = null,
  savingId = null,
  readOnly = false,
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">ID</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">Name</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">Email</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">Error Reason</th>
            {readOnly ? null : (
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                Action
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={readOnly ? 4 : 5} className="px-4 py-6">
                <EmptyState
                  title="No quarantined records"
                  description="No rows match your current filters."
                />
              </td>
            </tr>
          ) : null}
          {rows.map((row) => {
            const hasNameError = Boolean(row.fieldErrors?.name);
            const hasEmailError = Boolean(row.fieldErrors?.email);

            return (
              <tr key={row.id} className="align-top border-b border-zinc-100 hover:bg-zinc-50/70">
                <td className="px-4 py-3 font-medium text-zinc-700">{row.id}</td>
                <td className="px-4 py-3">
                  <EditableCell
                    value={row.name}
                    placeholder="Enter name"
                    hasError={hasNameError}
                    readOnly={readOnly}
                    onChange={(value) => onFieldChange(row.id, "name", value)}
                  />
                </td>
                <td className="px-4 py-3">
                  <EditableCell
                    value={row.email}
                    placeholder="Enter email"
                    hasError={hasEmailError}
                    readOnly={readOnly}
                    onChange={(value) => onFieldChange(row.id, "email", value)}
                  />
                </td>
                <td className="px-4 py-3">
                  {row.error ? (
                    <div className="space-y-2">
                      <span className="inline-flex rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
                        {row.error}
                      </span>
                      {onExplain ? (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => onExplain(row)}
                          disabled={explainingId === row.id}
                        >
                          {explainingId === row.id ? "Explaining..." : "AI explain"}
                        </Button>
                      ) : null}
                      {row.aiExplanation ? (
                        <p className="text-xs leading-relaxed text-zinc-600">{row.aiExplanation}</p>
                      ) : null}
                    </div>
                  ) : (
                    <span className="text-zinc-400">No errors</span>
                  )}
                </td>
                {readOnly ? null : (
                  <td className="px-4 py-3">
                    <Button
                      onClick={() => onSave(row.id)}
                      disabled={savingId === row.id}
                      size="sm"
                    >
                      {savingId === row.id ? "Saving..." : "Fix & Save"}
                    </Button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
