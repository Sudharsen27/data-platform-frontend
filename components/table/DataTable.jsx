import EditableCell from "@/components/table/EditableCell";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import {
  MDM_ERROR_BADGE,
  MDM_MUTED,
  MDM_TABLE,
  MDM_TABLE_HEAD,
  MDM_TABLE_ROW,
  MDM_TABLE_TD,
  MDM_TABLE_TH,
  MDM_TABLE_WRAP,
} from "@/lib/themeClasses";

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
    <div className={MDM_TABLE_WRAP}>
      <table className={MDM_TABLE}>
        <thead className={MDM_TABLE_HEAD}>
          <tr>
            <th className={MDM_TABLE_TH}>ID</th>
            <th className={MDM_TABLE_TH}>Name</th>
            <th className={MDM_TABLE_TH}>Email</th>
            <th className={MDM_TABLE_TH}>Error Reason</th>
            {readOnly ? null : <th className={MDM_TABLE_TH}>Action</th>}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={readOnly ? 4 : 5} className={MDM_TABLE_TD}>
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
              <tr key={row.id} className={MDM_TABLE_ROW}>
                <td className={`${MDM_TABLE_TD} font-medium tabular-nums`}>{row.id}</td>
                <td className={MDM_TABLE_TD}>
                  <EditableCell
                    value={row.name}
                    placeholder="Enter name"
                    hasError={hasNameError}
                    readOnly={readOnly}
                    onChange={(value) => onFieldChange(row.id, "name", value)}
                  />
                </td>
                <td className={MDM_TABLE_TD}>
                  <EditableCell
                    value={row.email}
                    placeholder="Enter email"
                    hasError={hasEmailError}
                    readOnly={readOnly}
                    onChange={(value) => onFieldChange(row.id, "email", value)}
                  />
                </td>
                <td className={MDM_TABLE_TD}>
                  {row.error ? (
                    <div className="flex max-w-xs flex-col gap-2">
                      <span className={MDM_ERROR_BADGE}>{row.error}</span>
                      {onExplain ? (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => onExplain(row)}
                          disabled={explainingId === row.id}
                        >
                          {explainingId === row.id ? "Explaining…" : "AI explain"}
                        </Button>
                      ) : null}
                    </div>
                  ) : (
                    <span className={MDM_MUTED}>No errors</span>
                  )}
                </td>
                {readOnly ? null : (
                  <td className={`${MDM_TABLE_TD} mdm-table-td--action`}>
                    <Button
                      onClick={() => onSave(row.id)}
                      disabled={savingId === row.id}
                      size="sm"
                    >
                      {savingId === row.id ? "Saving…" : "Fix & Save"}
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
