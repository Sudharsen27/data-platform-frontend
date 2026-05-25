"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import { configureSchedulerJob, getSchedulerJobs, runPipeline, triggerSnowflakeSync } from "@/lib/api";
import {
  SCHEDULE_MODES,
  WEEKDAYS,
  apiStateToForm,
  defaultScheduleForm,
  describeSchedule,
  formToApiPayload,
  syncBuilderCron,
} from "@/lib/scheduleUtils";
import { MDM_MUTED } from "@/lib/themeClasses";

const JOB_META = {
  snowflake_sync: {
    title: "Snowflake sync",
    description: "Push quarantine and rules from Postgres to Snowflake.",
    icon: "❄️",
    iconClass: "mdm-scheduler-card__icon--sync",
  },
  pipeline: {
    title: "Governance pipeline",
    description: "Ingest → validate → match → stewardship → golden in Postgres.",
    icon: "⚙️",
    iconClass: "mdm-scheduler-card__icon--pipeline",
  },
};

const PRESETS = [
  { mode: SCHEDULE_MODES.DAILY, label: "Daily" },
  { mode: SCHEDULE_MODES.WEEKLY, label: "Weekly" },
  { mode: SCHEDULE_MODES.INTERVAL, label: "Interval" },
  { mode: SCHEDULE_MODES.CUSTOM, label: "Manual" },
];

function formatNextRun(value) {
  if (!value) {
    return "Not scheduled";
  }
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(value));
}

function ScheduleModeFields({ form, setForm, disabled }) {
  const showCronField = form.schedule_mode !== SCHEDULE_MODES.INTERVAL;

  function updateForm(updater) {
    setForm((prev) => syncBuilderCron(typeof updater === "function" ? updater(prev) : updater));
  }

  return (
    <div className={`mdm-scheduler-fields ${disabled ? "mdm-scheduler-fields--muted" : ""}`}>
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          Frequency
        </p>
        <div className="mdm-scheduler-presets">
          {PRESETS.map((preset) => (
            <button
              key={preset.mode}
              type="button"
              disabled={disabled}
              onClick={() =>
                updateForm((prev) => ({
                  ...prev,
                  schedule_mode: preset.mode,
                  use_manual_cron: preset.mode === SCHEDULE_MODES.CUSTOM,
                }))
              }
              className={`mdm-scheduler-preset ${
                form.schedule_mode === preset.mode ? "mdm-scheduler-preset--active" : ""
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {(form.schedule_mode === SCHEDULE_MODES.DAILY ||
        form.schedule_mode === SCHEDULE_MODES.WEEKLY) && (
        <label className="block text-sm">
          <span className="font-medium text-[var(--foreground)]">Run at</span>
          <p className={`mt-0.5 text-xs ${MDM_MUTED}`}>Uses your local time</p>
          <input
            type="time"
            value={form.run_time}
            onChange={(event) =>
              updateForm((prev) => ({ ...prev, run_time: event.target.value }))
            }
            disabled={disabled}
            className="mdm-input mt-2 max-w-[10rem]"
          />
        </label>
      )}

      {form.schedule_mode === SCHEDULE_MODES.WEEKLY && (
        <div>
          <p className="mb-2 text-sm font-medium text-[var(--foreground)]">Days</p>
          <div className="flex flex-wrap gap-1.5">
            {WEEKDAYS.map((day) => {
              const selected = form.weekdays?.includes(day.value);
              return (
                <button
                  key={day.value}
                  type="button"
                  disabled={disabled}
                  onClick={() =>
                    updateForm((prev) => {
                      const current = new Set(prev.weekdays || []);
                      if (current.has(day.value)) {
                        current.delete(day.value);
                      } else {
                        current.add(day.value);
                      }
                      return { ...prev, weekdays: [...current].sort((a, b) => a - b) };
                    })
                  }
                  className={`mdm-scheduler-day-chip ${selected ? "mdm-scheduler-day-chip--on" : ""}`}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {form.schedule_mode === SCHEDULE_MODES.INTERVAL && (
        <label className="block text-sm">
          <span className="font-medium text-[var(--foreground)]">Every (minutes)</span>
          <input
            type="number"
            min={1}
            max={10080}
            value={form.interval_minutes}
            onChange={(event) =>
              updateForm((prev) => ({ ...prev, interval_minutes: event.target.value }))
            }
            disabled={disabled}
            className="mdm-input mt-2 max-w-[10rem]"
          />
          <p className={`mt-1.5 text-xs ${MDM_MUTED}`}>60 = hourly · 1440 = daily</p>
        </label>
      )}

      {showCronField ? (
        <div className="space-y-2 border-t border-[var(--border-subtle)] pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-sm font-medium text-[var(--foreground)]" htmlFor="cron-expression">
              Cron expression
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--text-muted)]">
              <input
                type="checkbox"
                checked={Boolean(form.use_manual_cron)}
                disabled={disabled}
                onChange={(event) => {
                  const checked = event.target.checked;
                  setForm((prev) => {
                    const next = {
                      ...prev,
                      use_manual_cron: checked,
                      schedule_mode: checked ? SCHEDULE_MODES.CUSTOM : SCHEDULE_MODES.DAILY,
                    };
                    return checked ? next : syncBuilderCron({ ...next, use_manual_cron: false });
                  });
                }}
                className="h-3.5 w-3.5 rounded border-[var(--mdm-border)] accent-[var(--color-primary)]"
              />
              Type manually
            </label>
          </div>
          <input
            id="cron-expression"
            type="text"
            value={form.cron_expression || ""}
            readOnly={disabled || !form.use_manual_cron}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                use_manual_cron: true,
                schedule_mode: SCHEDULE_MODES.CUSTOM,
                cron_expression: event.target.value,
              }))
            }
            disabled={disabled}
            placeholder="0 2 * * *"
            className={`mdm-input w-full font-mono text-sm ${
              !form.use_manual_cron ? "opacity-80" : ""
            }`}
          />
          <p className={`text-xs leading-relaxed ${MDM_MUTED}`}>
            Format: <span className="font-mono">minute hour day month weekday</span>. Examples:{" "}
            <span className="font-mono">0 2 * * *</span> daily 02:00,{" "}
            <span className="font-mono">30 8 * * 1-5</span> weekdays 08:30,{" "}
            <span className="font-mono">*/15 * * * *</span> every 15 minutes (use Interval preset
            instead for minutes-based runs).
          </p>
          {form.use_manual_cron ? (
            <button
              type="button"
              disabled={disabled}
              className="text-xs font-medium text-[var(--color-primary)] hover:underline"
              onClick={() =>
                setForm((prev) =>
                  syncBuilderCron({
                    ...prev,
                    use_manual_cron: false,
                    schedule_mode:
                      prev.schedule_mode === SCHEDULE_MODES.CUSTOM
                        ? SCHEDULE_MODES.DAILY
                        : prev.schedule_mode,
                  })
                )
              }
            >
              Sync from Daily / Weekly settings
            </button>
          ) : (
            <p className={`text-xs ${MDM_MUTED}`}>
              Field updates from your schedule above. Check <strong>Type manually</strong> to edit.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function JobSchedulerCard({
  jobType,
  initialState,
  onNotify,
  onRefresh,
  runNowDisabled = false,
  runNowDisabledReason = "",
}) {
  const meta = JOB_META[jobType];
  const [form, setForm] = useState(defaultScheduleForm);
  const [nextRunAt, setNextRunAt] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRunningNow, setIsRunningNow] = useState(false);

  useEffect(() => {
    if (!initialState) {
      return;
    }
    setForm(apiStateToForm(initialState));
    setNextRunAt(initialState.next_run_at || null);
  }, [initialState]);

  const summary = useMemo(() => describeSchedule(form), [form]);
  const isActive = Boolean(initialState?.enabled) || form.enabled;

  async function persistSchedule(forceEnable = false) {
    const scheduleForm = forceEnable ? { ...form, enabled: true } : form;
    if (forceEnable && !form.enabled) {
      setForm(scheduleForm);
    }
    const payload = formToApiPayload(jobType, scheduleForm);
    const data = await configureSchedulerJob(payload);
    const updated = data.jobs?.find((job) => job.job_type === jobType);
    if (updated) {
      setForm(apiStateToForm(updated));
      setNextRunAt(updated.next_run_at || null);
    }
    await onRefresh?.();
  }

  async function executeRunNow() {
    if (jobType === "pipeline") {
      await runPipeline();
    } else {
      await triggerSnowflakeSync();
    }
  }

  async function handleSave() {
    try {
      setIsSaving(true);
      await persistSchedule(false);
      onNotify?.(`${meta.title} schedule saved.`, { type: "success" });
    } catch (error) {
      onNotify?.(error.message || "Failed to save schedule.", { type: "error" });
    } finally {
      setIsSaving(false);
    }
  }

  const fieldsDisabled = !form.enabled;
  const isBusy = isSaving || isRunningNow;

  function notifyPipelineStart() {
    onNotify?.("Starting governance pipeline…", {
      type: "info",
      id: "pipeline-run",
      title: "Pipeline running",
      duration: 0,
    });
  }

  async function handleRunNow() {
    try {
      setIsRunningNow(true);
      if (jobType === "pipeline") {
        notifyPipelineStart();
      } else {
        onNotify?.("Starting Snowflake sync…", {
          type: "info",
          id: "snowflake-sync",
          title: "Sync",
          duration: 0,
        });
      }
      await executeRunNow();
      if (jobType !== "pipeline") {
        onNotify?.("Snowflake sync finished — see job history below.", {
          type: "success",
          id: "snowflake-sync",
          title: "Sync complete",
          duration: 6000,
        });
      }
      await onRefresh?.();
    } catch (error) {
      onNotify?.(error.message || "Failed to run job.", {
        type: "error",
        id: jobType === "pipeline" ? "pipeline-run" : "snowflake-sync",
        title: "Job failed",
        duration: 8000,
      });
    } finally {
      setIsRunningNow(false);
    }
  }

  async function handleSaveAndRunNow() {
    try {
      setIsSaving(true);
      await persistSchedule(true);
      setIsSaving(false);
      setIsRunningNow(true);
      if (jobType === "pipeline") {
        notifyPipelineStart();
      } else {
        onNotify?.("Starting Snowflake sync…", {
          type: "info",
          id: "snowflake-sync",
          title: "Sync",
          duration: 0,
        });
      }
      await executeRunNow();
      if (jobType !== "pipeline") {
        onNotify?.(`${meta.title}: schedule saved and sync completed.`, {
          type: "success",
          id: "snowflake-sync",
          title: "Sync complete",
          duration: 6000,
        });
      }
      await onRefresh?.();
    } catch (error) {
      onNotify?.(error.message || "Failed to save schedule and run job.", {
        type: "error",
        id: jobType === "pipeline" ? "pipeline-run" : "snowflake-sync",
        duration: 8000,
      });
    } finally {
      setIsSaving(false);
      setIsRunningNow(false);
    }
  }

  return (
    <article className="mdm-scheduler-card">
      <header className="mdm-scheduler-card__header">
        <div className="flex min-w-0 items-start gap-3">
          <span className={`mdm-scheduler-card__icon ${meta.iconClass}`} aria-hidden>
            {meta.icon}
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-semibold tracking-tight text-[var(--foreground)]">
              {meta.title}
            </h3>
            <p className="mt-0.5 text-sm leading-relaxed text-[var(--text-muted)]">
              {meta.description}
            </p>
          </div>
        </div>
        <span
          className={`mdm-scheduler-status-pill ${
            isActive ? "mdm-scheduler-status-pill--on" : "mdm-scheduler-status-pill--off"
          }`}
        >
          <span className="mdm-scheduler-status-pill__dot" />
          {isActive ? "Scheduled" : "Off"}
        </span>
      </header>

      <div className="mdm-scheduler-card__body">
        {runNowDisabled ? (
          <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-200/90">
            Snowflake sync is unavailable. Set <code className="font-mono">SNOWFLAKE_ENABLED=true</code> and
            credentials in <code className="font-mono">backend/.env</code>, or use the governance pipeline
            for Postgres-only runs.
          </p>
        ) : null}

        <div className="mdm-scheduler-toggle">
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">Automatic runs</p>
            <p className={`mt-0.5 text-xs ${MDM_MUTED}`}>
              {form.enabled ? "Recurring schedule is on" : "One-off runs only until enabled"}
            </p>
          </div>
          <label className="mdm-scheduler-switch" title="Enable scheduled runs">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, enabled: event.target.checked }))
              }
            />
            <span className="mdm-scheduler-switch__thumb" />
          </label>
        </div>

        <ScheduleModeFields form={form} setForm={setForm} disabled={fieldsDisabled} />

        <div className="mdm-scheduler-stats">
          <div className="mdm-scheduler-stat">
            <p className="mdm-scheduler-stat__label">Schedule</p>
            <p className="mdm-scheduler-stat__value">
              {form.enabled ? summary : "Manual runs only"}
            </p>
          </div>
          <div className="mdm-scheduler-stat">
            <p className="mdm-scheduler-stat__label">Next run</p>
            <p className="mdm-scheduler-stat__value">{formatNextRun(nextRunAt)}</p>
          </div>
        </div>

        <div className="mdm-scheduler-actions">
          <Button
            className="mdm-scheduler-actions__primary"
            onClick={handleSaveAndRunNow}
            disabled={isBusy || runNowDisabled}
            title={runNowDisabled ? runNowDisabledReason : undefined}
          >
            {isSaving && isRunningNow
              ? "Saving & running…"
              : isSaving
                ? "Saving…"
                : isRunningNow
                  ? "Running…"
                  : "Save schedule & run now"}
          </Button>
          <div className="mdm-scheduler-actions__row">
            <Button variant="secondary" onClick={handleSave} disabled={isBusy}>
              Save only
            </Button>
            <Button
              variant="secondary"
              onClick={handleRunNow}
              disabled={isBusy || runNowDisabled}
              title={runNowDisabled ? runNowDisabledReason : undefined}
            >
              Run once
            </Button>
          </div>
        </div>

        <p className="mdm-scheduler-hint">
          Progress and results appear in the <strong>top-right toast</strong>. Use{" "}
          <strong>Save schedule & run now</strong> for both recurring timing and an immediate run.
        </p>
      </div>
    </article>
  );
}

export default function JobSchedulerPanel({ isAdmin, snowflakeReady = true, onNotify }) {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  async function loadScheduler() {
    try {
      setIsLoading(true);
      const data = await getSchedulerJobs();
      setJobs(data.jobs || []);
    } catch (error) {
      onNotify?.(error.message || "Failed to load scheduler.", { type: "error" });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (isAdmin) {
      loadScheduler();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return null;
  }

  const byType = Object.fromEntries(jobs.map((job) => [job.job_type, job]));

  return (
    <section className="mdm-scheduler-section">
      <header>
        <h2 className="text-lg font-semibold tracking-tight text-[var(--foreground)]">
          Job scheduler
        </h2>
        <p className={`mt-1 max-w-2xl text-sm leading-relaxed ${MDM_MUTED}`}>
          Automate governance and sync jobs. Pick a frequency, save the schedule, and run immediately
          — notifications show on the top right.
        </p>
      </header>

      {isLoading ? (
        <div className="mdm-scheduler-card p-6">
          <div className="flex flex-col gap-3">
            <div className="h-5 w-40 animate-pulse rounded bg-[var(--color-surface-hover)]" />
            <div className="h-24 animate-pulse rounded bg-[var(--color-surface-hover)]" />
          </div>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          <JobSchedulerCard
            jobType="pipeline"
            initialState={byType.pipeline}
            onNotify={onNotify}
            onRefresh={loadScheduler}
          />
          <JobSchedulerCard
            jobType="snowflake_sync"
            initialState={byType.snowflake_sync}
            onNotify={onNotify}
            onRefresh={loadScheduler}
            runNowDisabled={!snowflakeReady}
            runNowDisabledReason="Snowflake sync unavailable"
          />
        </div>
      )}
    </section>
  );
}
