import { useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

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
          <label className="text-sm font-medium text-zinc-700">Field Name</label>
          <input
            type="text"
            value={formData.field}
            onChange={(event) =>
              setFormData((current) => ({ ...current, field: event.target.value }))
            }
            placeholder="email"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-blue-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700">Rule</label>
          <input
            type="text"
            value={formData.rule}
            onChange={(event) =>
              setFormData((current) => ({ ...current, rule: event.target.value }))
            }
            placeholder="Email cannot be null"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-blue-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700">Status</label>
          <select
            value={formData.status}
            onChange={(event) =>
              setFormData((current) => ({ ...current, status: event.target.value }))
            }
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-blue-500"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : editingRule
              ? "Update Rule"
              : "Create Rule"}
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
