import ToastItem from "@/components/ui/ToastItem";

/** Single toast fixed top-right (legacy pages). Prefer ToastStack + useToast for live updates. */
export default function Toast({ message, type = "success", title }) {
  if (!message) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed top-4 right-4 z-[100] w-[min(calc(100vw-2rem),22rem)]">
      <ToastItem message={message} type={type} title={title} />
    </div>
  );
}
