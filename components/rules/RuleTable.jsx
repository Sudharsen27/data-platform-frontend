import Button from "@/components/ui/Button";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  MDM_TABLE,
  MDM_TABLE_HEAD,
  MDM_TABLE_ROW,
  MDM_TABLE_TD,
  MDM_TABLE_TH,
  MDM_TABLE_WRAP,
} from "@/lib/themeClasses";

export default function RuleTable({
  rules,
  onEdit,
  onDelete,
  deletingId = null,
  readOnly = false,
}) {
  return (
    <div className={MDM_TABLE_WRAP}>
      <table className={MDM_TABLE}>
        <thead className={MDM_TABLE_HEAD}>
          <tr>
            <th className={MDM_TABLE_TH}>ID</th>
            <th className={MDM_TABLE_TH}>Field</th>
            <th className={MDM_TABLE_TH}>Rule</th>
            <th className={MDM_TABLE_TH}>Status</th>
            <th className={MDM_TABLE_TH}>Created by</th>
            {readOnly ? null : <th className={MDM_TABLE_TH}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rules.map((ruleItem) => (
            <tr key={ruleItem.id} className={MDM_TABLE_ROW}>
              <td className={`${MDM_TABLE_TD} font-medium tabular-nums`}>{ruleItem.id}</td>
              <td className={`${MDM_TABLE_TD} font-medium`}>{ruleItem.field}</td>
              <td className={MDM_TABLE_TD}>{ruleItem.rule}</td>
              <td className={MDM_TABLE_TD}>
                <StatusBadge status={ruleItem.status} />
              </td>
              <td className={`${MDM_TABLE_TD} text-xs text-[var(--text-muted)]`}>
                {ruleItem.created_by || "system"}
              </td>
              {readOnly ? null : (
                <td className={`${MDM_TABLE_TD} mdm-table-td--action`}>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => onEdit(ruleItem)} variant="secondary" size="sm">
                      Edit
                    </Button>
                    <Button
                      onClick={() => onDelete(ruleItem.id)}
                      disabled={deletingId === ruleItem.id}
                      variant="danger"
                      size="sm"
                    >
                      {deletingId === ruleItem.id ? "Deleting…" : "Delete"}
                    </Button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
