"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";

const SECTIONS = [
  ["summary", "Summary"],
  ["business_description", "Business Description"],
  ["purpose", "Business Purpose"],
  ["owner_recommendation", "Data Owner Recommendation"],
  ["classification_summary", "Classification Summary"],
  ["governance_notes", "Governance Notes"],
  ["quality_expectations", "Quality Expectations"],
  ["usage_guidelines", "Usage Guidelines"],
  ["compliance_considerations", "Compliance Considerations"],
];

function docToPlainText(doc) {
  if (!doc) {
    return "";
  }
  const lines = [doc.title, ""];
  for (const [key, label] of SECTIONS) {
    if (doc[key]) {
      lines.push(`${label}:`, doc[key], "");
    }
  }
  if (doc.key_fields?.length) {
    lines.push("Key Fields:");
    for (const field of doc.key_fields) {
      lines.push(
        `- ${field.field_name} (${field.classification || "Unknown"}): ${field.description || ""}`
      );
    }
  }
  return lines.join("\n");
}

function downloadBlob(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function DatasetDocumentationPanel({
  doc,
  loading,
  onRegenerate,
  onSave,
  onExport,
  canSave = true,
}) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({});

  useEffect(() => {
    if (doc) {
      setDraft({ ...doc });
    }
  }, [doc]);

  const handleCopy = useCallback(async () => {
    const text = docToPlainText(editing ? draft : doc);
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
  }, [doc, draft, editing]);

  const handleExport = useCallback(
    async (format) => {
      if (onExport) {
        await onExport(format);
        return;
      }
      const payload = editing ? draft : doc;
      const slug = (payload.dataset_key || "dataset").replace(/\./g, "_");
      if (format === "markdown" && payload.export_markdown) {
        downloadBlob(payload.export_markdown, `${slug}_documentation.md`, "text/markdown");
        return;
      }
      if (format === "text") {
        downloadBlob(docToPlainText(payload), `${slug}_documentation.txt`, "text/plain");
        return;
      }
      if (format === "pdf") {
        const html = `<html><head><title>${payload.title || "Documentation"}</title></head><body><pre style="font-family: sans-serif; white-space: pre-wrap;">${docToPlainText(payload)}</pre></body></html>`;
        const printWindow = window.open("", "_blank");
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.focus();
          printWindow.print();
        }
      }
    },
    [doc, draft, editing, onExport]
  );

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-[var(--text-muted)]">
        <Spinner size="sm" />
        Generating documentation…
      </div>
    );
  }

  if (!doc) {
    return null;
  }

  const display = editing ? draft : doc;

  return (
    <div className="space-y-3 rounded-lg border border-emerald-100 bg-emerald-50/40 p-3 dark:border-emerald-900/40 dark:bg-emerald-950/20">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
            Dataset documentation
          </p>
          {editing ? (
            <input
              value={draft.title || ""}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              className="mt-1 w-full rounded border border-[var(--border-color)] px-2 py-1 text-sm font-semibold"
            />
          ) : (
            <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">{display.title}</p>
          )}
          {display.status ? (
            <p className="text-[10px] capitalize text-[var(--text-subtle)]">
              Status: {display.status}
              {display.source_engine ? ` · ${display.source_engine}` : ""}
            </p>
          ) : display.source_engine ? (
            <p className="text-[10px] text-[var(--text-subtle)]">Source: {display.source_engine}</p>
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
          <Button type="button" variant="secondary" size="sm" onClick={() => setEditing((e) => !e)}>
            {editing ? "Preview" : "Edit"}
          </Button>
          {canSave && onSave ? (
            <Button type="button" size="sm" onClick={() => onSave(editing ? draft : doc)}>
              Save documentation
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-1 border-t border-emerald-100 pt-2 dark:border-emerald-900/40">
        <span className="w-full text-[10px] font-semibold uppercase text-[var(--text-subtle)]">
          Export documentation
        </span>
        {["markdown", "text", "pdf"].map((format) => (
          <Button
            key={format}
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => handleExport(format)}
          >
            {format.toUpperCase()}
          </Button>
        ))}
      </div>

      <div className="space-y-3 text-xs leading-relaxed text-[var(--foreground)]">
        {SECTIONS.map(([key, label]) =>
          display[key] ? (
            <div key={key}>
              <p className="text-[10px] font-semibold uppercase text-[var(--text-muted)]">{label}</p>
              {editing ? (
                <textarea
                  value={draft[key] || ""}
                  onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
                  rows={key === "summary" ? 3 : 2}
                  className="mt-1 w-full rounded border border-[var(--border-color)] px-2 py-1"
                />
              ) : (
                <p className="mt-0.5 whitespace-pre-wrap">{display[key]}</p>
              )}
            </div>
          ) : null
        )}

        {(display.key_fields || []).length > 0 ? (
          <div>
            <p className="text-[10px] font-semibold uppercase text-[var(--text-muted)]">Key Fields</p>
            <ul className="mt-1 space-y-1">
              {display.key_fields.map((field) => (
                <li key={field.field_name} className="rounded border border-[var(--border-subtle)] p-2">
                  <span className="font-mono font-semibold">{field.field_name}</span>
                  {field.classification ? (
                    <span className="ml-2 text-[10px] text-[var(--text-muted)]">
                      ({field.classification})
                    </span>
                  ) : null}
                  <p className="mt-0.5">{field.description}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
