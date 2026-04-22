import Card from "@/components/ui/Card";

export default function StatsCard({ title, value }) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <p className="text-sm font-medium text-zinc-500">{title}</p>
      <p className="mt-3 text-3xl font-semibold text-blue-700">{value}</p>
    </Card>
  );
}
