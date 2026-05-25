import Card from "@/components/ui/Card";

export default function StatsCard({ title, value }) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <p className="text-sm font-medium text-[var(--text-muted)]">{title}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-[var(--color-primary)]">{value}</p>
    </Card>
  );
}
