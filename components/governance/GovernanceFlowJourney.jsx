"use client";

import Link from "next/link";

const STEPS = [
  { key: "quarantine", label: "Quarantine", short: "Fix bad data", href: "/quarantine", tone: "rose" },
  { key: "rules", label: "Rules", short: "DQ policies", href: "/rules", tone: "violet" },
  { key: "stewardship", label: "Stewardship", short: "Human review", href: "/stewardship", tone: "amber" },
  { key: "master", label: "Master Data", short: "Golden records", href: "/master-data", tone: "emerald" },
  { key: "catalog", label: "Catalog", short: "Business glossary", href: "/catalog", tone: "blue" },
  { key: "lineage", label: "Lineage", short: "Impact analysis", href: "/lineage", tone: "cyan" },
];

function Chevron() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

export default function GovernanceFlowJourney() {
  return (
    <div className="space-y-5">
      <div className="max-w-2xl">
        <p className="mdm-section-label">Enterprise lifecycle</p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
          A clear path from exception handling to trusted master data — designed for stewards,
          compliance, and leadership review.
        </p>
      </div>

      <div className="mdm-journey-track">
        {STEPS.map((step, index) => (
          <div key={step.key} className="mdm-journey-step-wrap">
            <Link
              href={step.href}
              className={`mdm-journey-step mdm-journey-step--${step.tone} min-h-[7.5rem]`}
            >
              <span className="mdm-journey-badge">{index + 1}</span>
              <span className="mdm-journey-title">{step.label}</span>
              <span className="mdm-journey-desc">{step.short}</span>
            </Link>
            {index < STEPS.length - 1 ? (
              <span className="mdm-journey-chevron" aria-hidden>
                <Chevron />
              </span>
            ) : null}
          </div>
        ))}
      </div>

      <div className="mdm-journey-footer">
        <Link href="/flow" className="mdm-chip-link">
          Pipeline orchestration
        </Link>
        <Link href="/ai-activity" className="mdm-chip-link">
          AI activity log
        </Link>
        <Link href="/dashboard" className="mdm-chip-link">
          Control center
        </Link>
      </div>
    </div>
  );
}
