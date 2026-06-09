"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";

function glossaryText(entry) {
  if (!entry) {
    return "";
  }
  const lines = [
    entry.title,
    entry.definition,
    entry.usage ? `Usage: ${entry.usage}` : "",
    entry.governance_notes ? `Governance: ${entry.governance_notes}` : "",
  ].filter(Boolean);
  if (entry.examples?.length) {
    lines.push(`Examples: ${entry.examples.join(", ")}`);
  }
  return lines.join("\n\n");
}

export default function GlossaryTermPanel({
  entry,
  loading,
  compact = false,
  onRegenerate,
  onSave,
  canSave = true,
}) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    title: "",
    definition: "",
    usage: "",
    governance_notes: "",
  });

  useEffect(() => {
    if (entry) {
      setDraft({
        title: entry.title || "",
        definition: entry.definition || "",
        usage: entry.usage || "",
        governance_notes: entry.governance_notes || "",
      });
    }
  }, [entry]);

  const handleCopy = useCallback(async () => {
    const text = glossaryText(entry);
    if (!text) {
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [entry]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-2 text-xs text-[var(--text-muted)]">
        <Spinner size="sm" />
        Generating glossary…
      </div>
    );
  }

  if (!entry) {
    return null;
  }

  return (
    <div
      className={`rounded-lg border border-[var(--border-subtle)] bg-[var(--color-surface)] ${
        compact ? "p-2" : "p-3"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase text-[var(--text-subtle)]">
            Business glossary
          </p>
          {editing ? (
            <input
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              className="mt-1 w-full rounded border border-[var(--border-color)] px-2 py-1 text-sm font-semibold"
            />
          ) : (
            <p className="mt-0.5 font-semibold text-[var(--foreground)]">{entry.title}</p>
          )}
          {entry.field_name ? (
            <p className="font-mono text-[10px] text-[var(--text-muted)]">{entry.field_name}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-1">
          <Button type="button" variant="secondary" size="sm" onClick={handleCopy}>
            {copied ? "Copied" : "Copy"}
          </Button>
          {onRegenerate ? (
            <Button type="button" variant="secondary" size="sm" onClick={onRegenerate}>
              Regenerate
            </Button>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setEditing((e) => !e)}
          >
            {editing ? "Preview" : "Edit"}
          </Button>
          {canSave && onSave ? (
            <Button
              type="button"
              size="sm"
              onClick={() => onSave(editing ? draft : entry)}
            >
              Save definition
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-2 space-y-2 text-xs leading-relaxed text-[var(--foreground)]">
        {editing ? (
          <>
            <textarea
              value={draft.definition}
              onChange={(e) => setDraft((d) => ({ ...d, definition: e.target.value }))}
              rows={3}
              className="w-full rounded border border-[var(--border-color)] px-2 py-1"
              placeholder="Definition"
            />
            <textarea
              value={draft.usage}
              onChange={(e) => setDraft((d) => ({ ...d, usage: e.target.value }))}
              rows={2}
              className="w-full rounded border border-[var(--border-color)] px-2 py-1"
              placeholder="Usage"
            />
            <textarea
              value={draft.governance_notes}
              onChange={(e) => setDraft((d) => ({ ...d, governance_notes: e.target.value }))}
              rows={2}
              className="w-full rounded border border-[var(--border-color)] px-2 py-1"
              placeholder="Governance notes"
            />
          </>
        ) : (
          <>
            <p>{entry.definition}</p>
            {entry.usage ? (
              <p>
                <span className="font-semibold text-[var(--text-muted)]">Usage: </span>
                {entry.usage}
              </p>
            ) : null}
            {entry.governance_notes ? (
              <p>
                <span className="font-semibold text-[var(--text-muted)]">Governance: </span>
                {entry.governance_notes}
              </p>
            ) : null}
            {entry.examples?.length ? (
              <p className="font-mono text-[10px] text-[var(--text-muted)]">
                Examples: {entry.examples.join(", ")}
              </p>
            ) : null}
          </>
        )}
      </div>

      {entry.saved_status || entry.status ? (
        <p className="mt-2 text-[10px] capitalize text-[var(--text-subtle)]">
          Status: {entry.saved_status || entry.status}
          {entry.source_engine ? ` · ${entry.source_engine}` : ""}
        </p>
      ) : entry.source_engine ? (
        <p className="mt-2 text-[10px] text-[var(--text-subtle)]">Source: {entry.source_engine}</p>
      ) : null}
    </div>
  );
}

export function GlossaryDatasetSummary({ loading, result, onRegenerate, onSave, canSave = true }) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-[var(--text-muted)]">
        <Spinner size="sm" />
        Generating dataset glossary…
      </div>
    );
  }
  if (!result) {
    return null;
  }

  return (
    <div className="space-y-3 rounded-lg border border-indigo-100 bg-indigo-50/40 p-3 dark:border-indigo-900/40 dark:bg-indigo-950/20">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-indigo-800 dark:text-indigo-300">
            Dataset glossary
          </p>
          <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">
            {result.dataset_title}
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          {onRegenerate ? (
            <Button type="button" variant="secondary" size="sm" onClick={onRegenerate}>
              Regenerate
            </Button>
          ) : null}
          {canSave && onSave ? (
            <Button type="button" size="sm" onClick={() => onSave(result)}>
              Save dataset glossary
            </Button>
          ) : null}
        </div>
      </div>
      <p className="text-sm text-[var(--foreground)]">{result.dataset_definition}</p>
      {result.business_usage ? (
        <p className="text-xs text-[var(--text-muted)]">
          <span className="font-semibold">Business usage: </span>
          {result.business_usage}
        </p>
      ) : null}
      {result.governance_notes ? (
        <p className="text-xs text-[var(--text-muted)]">
          <span className="font-semibold">Governance: </span>
          {result.governance_notes}
        </p>
      ) : null}
    </div>
  );
}
