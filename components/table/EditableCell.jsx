import { MDM_INPUT, MDM_INPUT_ERROR } from "@/lib/themeClasses";

export default function EditableCell({
  value,
  onChange,
  placeholder,
  hasError = false,
  readOnly = false,
}) {
  if (readOnly) {
    return (
      <span className="mdm-input mdm-input--readonly block max-w-none">
        {value || "—"}
      </span>
    );
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className={hasError ? MDM_INPUT_ERROR : MDM_INPUT}
    />
  );
}
