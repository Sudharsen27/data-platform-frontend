"use client";

const STATUS_LABEL = {
  completed: "Completed",
  running: "In progress",
  pending: "Waiting",
  failed: "Failed",
};

function statusModifier(status) {
  const s = String(status || "pending").toLowerCase();
  if (s === "completed") return "completed";
  if (s === "running") return "running";
  if (s === "failed") return "pending";
  return "pending";
}

function StageIcon({ status, index }) {
  const s = statusModifier(status);
  if (s === "completed") {
    return (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    );
  }
  if (s === "running") {
    return (
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-primary)] opacity-40" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-primary)]" />
      </span>
    );
  }
  return <span>{index + 1}</span>;
}

export default function PipelineTimeline({ steps = [] }) {
  const list = steps.length ? steps : [];

  return (
    <div className="mdm-pipeline-timeline">
      {list.map((step, index) => {
        const mod = statusModifier(step.status);
        const statusLabel = STATUS_LABEL[mod] || step.status;

        return (
          <div key={step.key}>
            <article className={`mdm-pipeline-stage mdm-pipeline-stage--${mod}`}>
              <div className="mdm-pipeline-stage-main">
                <div className="mdm-pipeline-stage-icon" aria-hidden>
                  <StageIcon status={step.status} index={index} />
                </div>
                <div className="min-w-0">
                  <p className="mdm-pipeline-stage-title">{step.label}</p>
                  <span className={`mdm-pipeline-status mdm-pipeline-status--${mod}`}>
                    {statusLabel}
                  </span>
                </div>
              </div>
              <div className="mdm-pipeline-metric">
                <p className="mdm-pipeline-metric-label">Records</p>
                <p className="mdm-pipeline-metric-value">
                  {Number(step.count || 0).toLocaleString()}
                </p>
              </div>
            </article>
            {index < list.length - 1 ? <div className="mdm-pipeline-connector" aria-hidden /> : null}
          </div>
        );
      })}
    </div>
  );
}
