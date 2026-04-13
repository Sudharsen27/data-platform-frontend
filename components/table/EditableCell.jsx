export default function EditableCell({
  value,
  onChange,
  placeholder,
  hasError = false,
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className={`w-full rounded-md border px-3 py-2 text-sm outline-none transition-colors ${
        hasError
          ? "border-red-300 bg-red-50 text-red-700 placeholder-red-400 focus:border-red-500"
          : "border-zinc-300 bg-white text-zinc-900 focus:border-zinc-500"
      }`}
    />
  );
}
