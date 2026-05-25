/** Client helpers: friendly schedule ↔ APScheduler crontab (minute hour day month weekday). */

export const SCHEDULE_MODES = {
  INTERVAL: "interval",
  DAILY: "daily",
  WEEKLY: "weekly",
  CUSTOM: "custom",
};

export const WEEKDAYS = [
  { value: 1, label: "Mon", short: "M" },
  { value: 2, label: "Tue", short: "T" },
  { value: 3, label: "Wed", short: "W" },
  { value: 4, label: "Thu", short: "T" },
  { value: 5, label: "Fri", short: "F" },
  { value: 6, label: "Sat", short: "S" },
  { value: 0, label: "Sun", short: "S" },
];

export function defaultScheduleForm() {
  return {
    enabled: false,
    schedule_mode: SCHEDULE_MODES.DAILY,
    interval_minutes: 60,
    run_time: "02:00",
    weekdays: [1, 2, 3, 4, 5],
    cron_expression: "0 2 * * *",
    use_manual_cron: false,
  };
}

/** Cron sent to the API (builder or manual text field). */
export function resolveCronExpression(form) {
  if (form.schedule_mode === SCHEDULE_MODES.INTERVAL) {
    return null;
  }
  if (form.use_manual_cron || form.schedule_mode === SCHEDULE_MODES.CUSTOM) {
    return (form.cron_expression || "").trim();
  }
  return buildCronFromForm(form);
}

export function syncBuilderCron(form) {
  if (
    form.use_manual_cron ||
    form.schedule_mode === SCHEDULE_MODES.INTERVAL ||
    form.schedule_mode === SCHEDULE_MODES.CUSTOM
  ) {
    return form;
  }
  const built = buildCronFromForm(form);
  if (!built) {
    return form;
  }
  return { ...form, cron_expression: built };
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

/** Split HTML time input "HH:MM" into minute and hour for cron. */
export function parseRunTime(runTime) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(runTime || "").trim());
  if (!match) {
    return { hour: 2, minute: 0 };
  }
  const hour = Math.min(23, Math.max(0, Number(match[1])));
  const minute = Math.min(59, Math.max(0, Number(match[2])));
  return { hour, minute };
}

export function formatRunTime(hour, minute) {
  return `${pad2(hour)}:${pad2(minute)}`;
}

export function buildCronFromForm(form) {
  const mode = form.schedule_mode;
  if (mode === SCHEDULE_MODES.INTERVAL) {
    return null;
  }
  if (mode === SCHEDULE_MODES.CUSTOM) {
    return (form.cron_expression || "").trim();
  }

  const { hour, minute } = parseRunTime(form.run_time);
  if (mode === SCHEDULE_MODES.DAILY) {
    return `${minute} ${hour} * * *`;
  }

  const days = Array.isArray(form.weekdays) ? [...form.weekdays].sort((a, b) => a - b) : [1];
  if (days.length === 0) {
    return `${minute} ${hour} * * 1`;
  }
  const dayPart = days.length === 7 ? "*" : days.join(",");
  return `${minute} ${hour} * * ${dayPart}`;
}

export function describeSchedule(form) {
  const mode = form.schedule_mode;
  if (mode === SCHEDULE_MODES.INTERVAL) {
    const n = Number(form.interval_minutes) || 10;
    return `Every ${n} minute${n === 1 ? "" : "s"}`;
  }
  if (mode === SCHEDULE_MODES.CUSTOM || form.use_manual_cron) {
    return `Cron: ${(form.cron_expression || "").trim() || "—"}`;
  }
  const { hour, minute } = parseRunTime(form.run_time);
  const timeLabel = formatRunTime(hour, minute);
  if (mode === SCHEDULE_MODES.DAILY) {
    return `Daily at ${timeLabel}`;
  }
  const labels = WEEKDAYS.filter((d) => form.weekdays?.includes(d.value)).map((d) => d.label);
  const dayText = labels.length ? labels.join(", ") : "Mon";
  return `${dayText} at ${timeLabel}`;
}

/**
 * Map API scheduler state → form (fixes interval UI when job is actually on cron).
 */
export function apiStateToForm(state) {
  const base = defaultScheduleForm();
  if (!state) {
    return base;
  }

  const enabled = Boolean(state.enabled);
  if (state.trigger_type === "interval" && state.interval_minutes) {
    return {
      ...base,
      enabled,
      schedule_mode: SCHEDULE_MODES.INTERVAL,
      interval_minutes: state.interval_minutes,
    };
  }

  const cron = (state.cron_expression || "").trim();
  if (!cron) {
    return { ...base, enabled };
  }

  const parsed = parseCronToForm(cron);
  const draft = {
    ...base,
    enabled,
    schedule_mode: parsed.schedule_mode,
    run_time: parsed.run_time,
    weekdays: parsed.weekdays,
    cron_expression: cron,
    interval_minutes: base.interval_minutes,
    use_manual_cron: false,
  };
  const built = buildCronFromForm(draft);
  const use_manual_cron =
    parsed.schedule_mode === SCHEDULE_MODES.CUSTOM || (built && built !== cron);
  return { ...draft, use_manual_cron };
}

export function parseCronToForm(cronExpression) {
  const cron = (cronExpression || "").trim();
  const parts = cron.split(/\s+/);
  if (parts.length < 5) {
    return {
      schedule_mode: SCHEDULE_MODES.CUSTOM,
      run_time: "02:00",
      weekdays: [1, 2, 3, 4, 5],
    };
  }

  const [minutePart, hourPart, dayPart, monthPart, dowPart] = parts;

  if (
    dayPart === "*" &&
    monthPart === "*" &&
    dowPart === "*" &&
    /^\d+$/.test(minutePart) &&
    /^\d+$/.test(hourPart)
  ) {
    return {
      schedule_mode: SCHEDULE_MODES.DAILY,
      run_time: formatRunTime(Number(hourPart), Number(minutePart)),
      weekdays: [1, 2, 3, 4, 5],
    };
  }

  if (
    dayPart === "*" &&
    monthPart === "*" &&
    dowPart !== "*" &&
    /^\d+$/.test(minutePart) &&
    /^\d+$/.test(hourPart)
  ) {
    const weekdays = expandDayOfWeek(dowPart);
    return {
      schedule_mode: SCHEDULE_MODES.WEEKLY,
      run_time: formatRunTime(Number(hourPart), Number(minutePart)),
      weekdays: weekdays.length ? weekdays : [1],
    };
  }

  return {
    schedule_mode: SCHEDULE_MODES.CUSTOM,
    run_time: "02:00",
    weekdays: [1, 2, 3, 4, 5],
  };
}

function expandDayOfWeek(part) {
  if (part === "*") {
    return WEEKDAYS.map((d) => d.value);
  }
  const values = new Set();
  for (const chunk of part.split(",")) {
    if (chunk.includes("-")) {
      const [start, end] = chunk.split("-").map(Number);
      for (let d = start; d <= end; d += 1) {
        values.add(d);
      }
    } else if (/^\d+$/.test(chunk)) {
      values.add(Number(chunk));
    }
  }
  return [...values].sort((a, b) => a - b);
}

export function formToApiPayload(jobType, form) {
  const enabled = Boolean(form.enabled);
  if (!enabled) {
    return {
      job_type: jobType,
      enabled: false,
      trigger_type: "interval",
      interval_minutes: 10,
      cron_expression: null,
    };
  }

  if (form.schedule_mode === SCHEDULE_MODES.INTERVAL) {
    return {
      job_type: jobType,
      enabled: true,
      trigger_type: "interval",
      interval_minutes: Number(form.interval_minutes) || 10,
      cron_expression: null,
    };
  }

  const cron = resolveCronExpression(form);
  if (!cron) {
    throw new Error("Cron expression is required");
  }

  return {
    job_type: jobType,
    enabled: true,
    trigger_type: "cron",
    interval_minutes: null,
    cron_expression: cron,
  };
}
