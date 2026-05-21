"use client";

import Link from "next/link";

function formatTime(value) {
  if (!value) {
    return "—";
  }
  return new Date(value).toLocaleString();
}

export default function CompareThreeColumn({ data }) {
  if (!data) {
    return <p className="text-sm text-zinc-500">No comparison data.</p>;
  }

  const { stewardship, quarantine, golden, is_published, source_queue_id } = data;

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-600">
        <strong>#{source_queue_id}</strong> —{" "}
        {is_published
          ? `Published as golden record #${golden?.id ?? "—"}`
          : "Not published to master data yet."}
      </p>
      <div className="grid gap-4 lg:grid-cols-1">
        <section className="rounded-lg border border-zinc-200 bg-white p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Quarantine (source)
          </h3>
          {quarantine ? (
            <dl className="mt-2 space-y-2 text-sm">
              <div>
                <dt className="text-zinc-500">Name</dt>
                <dd className="font-medium text-zinc-900">{quarantine.name}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Email</dt>
                <dd className="font-mono text-xs">{quarantine.email || "—"}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Error</dt>
                <dd className="text-rose-700">{quarantine.error || "—"}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Match</dt>
                <dd>{quarantine.match_status || "—"}</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-2 text-sm text-zinc-500">No quarantine row linked.</p>
          )}
        </section>
        <section className="rounded-lg border border-amber-200 bg-amber-50/50 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-800">
            Stewardship
          </h3>
          <dl className="mt-2 space-y-2 text-sm">
            <div>
              <dt className="text-zinc-500">Status</dt>
              <dd className="font-medium capitalize">{stewardship.status}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Owner</dt>
              <dd>{stewardship.owner_email || "Unassigned"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Issue</dt>
              <dd>{stewardship.issue || "—"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Name / Email</dt>
              <dd>
                {stewardship.name} · {stewardship.email || "—"}
              </dd>
            </div>
          </dl>
        </section>
        <section className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
            Golden record
          </h3>
          {golden ? (
            <dl className="mt-2 space-y-2 text-sm">
              <div>
                <dt className="text-zinc-500">Master ID</dt>
                <dd className="font-medium">#{golden.id}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Name</dt>
                <dd>{golden.name}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Email</dt>
                <dd className="font-mono text-xs">{golden.email}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Published</dt>
                <dd>{formatTime(golden.created_at)}</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-2 text-sm text-zinc-500">
              Approve in stewardship to publish.{" "}
              <Link href="/stewardship" className="font-medium text-blue-700 hover:underline">
                Open queue →
              </Link>
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
