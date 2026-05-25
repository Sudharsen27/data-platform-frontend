import { useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { MDM_INPUT_WIDE } from "@/lib/themeClasses";

const emptyForm = {
  field: "",
  rule: "",
  status: "active",
};

export default function RuleForm({
  editingRule,
  onSave,
  onCancel,
  isSubmitting = false,
}) {
  const [formData, setFormData] = useState(
    editingRule
      ? {
          field: editingRule.field,
          rule: editingRule.rule,
          status: editingRule.status,
        }
      : emptyForm
  );

  function handleSubmit(event) {
    event.preventDefault();

    if (!formData.field.trim() || !formData.rule.trim()) {
      return;
    }

    onSave({
      field: formData.field.trim(),
      rule: formData.rule.trim(),
      status: formData.status,
    });

    setFormData(emptyForm);
  }

  return (
    <Card title={editingRule ? "Edit Rule" : "Create Rule"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-[var(--foreground)]">Field Name</label>
          <input
            type="text"
            value={formData.field}
            onChange={(event) =>
              setFormData((current) => ({ ...current, field: event.target.value }))
            }
            placeholder="email"
            className={MDM_INPUT_WIDE}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-[var(--foreground)]">Rule</label>
          <input
            type="text"
            value={formData.rule}
            onChange={(event) =>
              setFormData((current) => ({ ...current, rule: event.target.value }))
            }
            placeholder="Email cannot be null"
            className={MDM_INPUT_WIDE}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-[var(--foreground)]">Status</label>
          <select
            value={formData.status}
            onChange={(event) =>
              setFormData((current) => ({ ...current, status: event.target.value }))
            }
            className={MDM_INPUT_WIDE}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : editingRule ? "Update Rule" : "Create Rule"}
          </Button>
          {editingRule ? (
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
          ) : null}
        </div>
      </form>
    </Card>
  );
}
