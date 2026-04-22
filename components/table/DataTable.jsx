import EditableCell from "@/components/table/EditableCell";
import Button from "@/components/ui/Button";

export default function DataTable({ rows, onFieldChange, onSave, savingId = null }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">ID</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">Name</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">Email</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">Error Reason</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">Action</th>
          </tr>
        </thead>
        <tbody>
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
                    onChange={(value) => onFieldChange(row.id, "name", value)}
                  />
                </td>
                <td className="px-4 py-3">
                  <EditableCell
                    value={row.email}
                    placeholder="Enter email"
                    hasError={hasEmailError}
                    onChange={(value) => onFieldChange(row.id, "email", value)}
                  />
                </td>
                <td className="px-4 py-3">
                  {row.error ? (
                    <span className="inline-flex rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
                      {row.error}
                    </span>
                  ) : (
                    <span className="text-zinc-400">No errors</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Button
                    onClick={() => onSave(row.id)}
                    disabled={savingId === row.id}
                    size="sm"
                  >
                    {savingId === row.id ? "Saving..." : "Fix & Save"}
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
