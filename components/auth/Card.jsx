export default function Card({ className = "", children }) {
  return (
    <section
      className={`rounded-[var(--radius-card)] border border-white/60 bg-white/70 p-8 shadow-[var(--shadow-card)] backdrop-blur-xl supports-[backdrop-filter]:bg-white/65 ${className}`}
    >
      {children}
    </section>
  );
}
