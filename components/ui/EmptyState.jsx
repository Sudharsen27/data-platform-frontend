import { MDM_EMPTY } from "@/lib/themeClasses";

export default function EmptyState({ title = "No data", description = "No records available right now." }) {
  return (
    <div className={MDM_EMPTY}>
      <p className="mdm-empty-title">{title}</p>
      <p className="mdm-empty-desc">{description}</p>
    </div>
  );
}
