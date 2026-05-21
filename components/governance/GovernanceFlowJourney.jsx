"use client";

import Link from "next/link";

const STEPS = [
  {
    key: "quarantine",
    label: "Quarantine",
    short: "Fix bad data",
    href: "/quarantine",
    color: "border-rose-200 bg-rose-50 text-rose-900",
  },
  {
    key: "rules",
    label: "Rules",
    short: "DQ policies",
    href: "/rules",
    color: "border-violet-200 bg-violet-50 text-violet-900",
  },
  {
    key: "stewardship",
    label: "Stewardship",
    short: "Human review",
    href: "/stewardship",
    color: "border-amber-200 bg-amber-50 text-amber-900",
  },
  {
    key: "master",
    label: "Master Data",
    short: "Golden records",
    href: "/master-data",
    color: "border-emerald-200 bg-emerald-50 text-emerald-900",
  },
  {
    key: "catalog",
    label: "Catalog",
    short: "Business glossary",
    href: "/catalog",
    color: "border-blue-200 bg-blue-50 text-blue-900",
  },
  {
    key: "lineage",
    label: "Lineage",
    short: "Impact analysis",
    href: "/lineage",
    color: "border-cyan-200 bg-cyan-50 text-cyan-900",
  },
];

export default function GovernanceFlowJourney() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-600">
        Records move from exception handling to authoritative master data. Catalog and lineage
        connect business terms to technical dependencies for change impact analysis.
      </p>
      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-stretch">
        {STEPS.map((step, index) => (
          <div key={step.key} className="flex min-w-0 flex-1 flex-col gap-2 sm:min-w-[140px]">
            <Link
              href={step.href}
              className={`flex flex-1 flex-col rounded-xl border p-4 transition hover:shadow-md ${step.color}`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                Step {index + 1}
              </span>
              <span className="mt-1 text-base font-semibold">{step.label}</span>
              <span className="mt-1 text-xs opacity-85">{step.short}</span>
            </Link>
            {index < STEPS.length - 1 ? (
              <span
                className="hidden text-center text-zinc-300 lg:block lg:rotate-0"
                aria-hidden
              >
                →
              </span>
            ) : null}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        <Link
          href="/flow"
          className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Pipeline orchestration
        </Link>
        <Link
          href="/ai-activity"
          className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 font-medium text-zinc-700 hover:bg-zinc-50"
        >
          AI activity log
        </Link>
        <Link
          href="/dashboard"
          className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Control center
        </Link>
      </div>
    </div>
  );
}
