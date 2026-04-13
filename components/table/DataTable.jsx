import EditableCell from "@/components/table/EditableCell";

export default function DataTable({ rows, onFieldChange, onSave, savingId = null }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-zinc-200 text-sm">
        <thead className="bg-zinc-50">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-zinc-600">ID</th>
            <th className="px-4 py-3 text-left font-semibold text-zinc-600">Name</th>
            <th className="px-4 py-3 text-left font-semibold text-zinc-600">Email</th>
            <th className="px-4 py-3 text-left font-semibold text-zinc-600">Error Reason</th>
            <th className="px-4 py-3 text-left font-semibold text-zinc-600">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {rows.map((row) => {
            const hasNameError = Boolean(row.fieldErrors?.name);
            const hasEmailError = Boolean(row.fieldErrors?.email);

            return (
              <tr key={row.id} className="align-top">
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
                  <button
                    type="button"
                    onClick={() => onSave(row.id)}
                    disabled={savingId === row.id}
                    className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-500"
                  >
                    {savingId === row.id ? "Saving..." : "Fix & Save"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
