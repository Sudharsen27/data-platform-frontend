import { REFRESH_TOKEN_KEY, TOKEN_KEY } from "@/lib/authConstants";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
/** Prevents hung TCP connects from filling the browser's per-host connection pool and freezing the whole app. */
const DEFAULT_AUTH_FETCH_TIMEOUT_MS = 20000;
const REFRESH_FETCH_TIMEOUT_MS = 15000;
let authRedirectInProgress = false;

function normalizeErrorDetail(payload) {
  const detail = payload?.detail;
  if (typeof detail === "string") {
    return detail;
  }
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => (typeof item?.msg === "string" ? item.msg : null))
      .filter(Boolean);
    if (messages.length) {
      return messages.join(" ");
    }
  }
  return null;
}

function getAuthHeaders() {
  if (typeof window === "undefined") {
    return {};
  }

  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

async function fetchWithTimeout(url, init, timeoutMs) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } catch (err) {
    if (err && err.name === "AbortError") {
      throw new Error(
        `Request timed out after ${timeoutMs / 1000}s. Is the API reachable at ${BASE_URL}?`
      );
    }
    throw err;
  } finally {
    clearTimeout(t);
  }
}

async function refreshAccessToken() {
  if (typeof window === "undefined") {
    return null;
  }
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) {
    return null;
  }
  let response;
  try {
    response = await fetchWithTimeout(
      `${BASE_URL}/auth/refresh`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      },
      REFRESH_FETCH_TIMEOUT_MS
    );
  } catch {
    return null;
  }
  if (!response.ok) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    if (!authRedirectInProgress && typeof window !== "undefined") {
      authRedirectInProgress = true;
      window.location.replace("/login");
    }
    return null;
  }
  const data = await response.json().catch(() => ({}));
  const accessToken = data?.access_token;
  if (typeof accessToken === "string" && accessToken) {
    localStorage.setItem(TOKEN_KEY, accessToken);
    return accessToken;
  }
  return null;
}

async function authFetch(url, init = {}) {
  const timeoutMs =
    typeof init.timeoutMs === "number" ? init.timeoutMs : DEFAULT_AUTH_FETCH_TIMEOUT_MS;
  const rest = { ...init };
  delete rest.timeoutMs;
  const baseHeaders = { ...(rest.headers || {}), ...getAuthHeaders() };

  const first = await fetchWithTimeout(
    url,
    {
      ...rest,
      headers: baseHeaders,
    },
    timeoutMs
  );
  if (first.status !== 401) {
    return first;
  }
  const refreshed = await refreshAccessToken();
  if (!refreshed) {
    return first;
  }
  const retryHeaders = { ...(rest.headers || {}), ...getAuthHeaders() };
  return fetchWithTimeout(
    url,
    {
      ...rest,
      headers: retryHeaders,
    },
    timeoutMs
  );
}

function throwNormalizedError(payload, fallbackMessage) {
  const message = normalizeErrorDetail(payload) || fallbackMessage;
  const lowered = String(message).toLowerCase();
  const looksLikeAuthError =
    lowered.includes("invalid or expired token") ||
    lowered.includes("not authenticated") ||
    lowered.includes("invalid token");
  if (looksLikeAuthError && typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    if (!authRedirectInProgress) {
      authRedirectInProgress = true;
      window.location.replace("/login");
    }
    throw new Error("Session expired. Please login again.");
  }
  throw new Error(message);
}

async function downloadCsv(url, filename, withAuth = false, fetchInit = {}) {
  const response = withAuth
    ? await authFetch(url, fetchInit)
    : await fetch(url, fetchInit);

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(normalizeErrorDetail(payload) || "Failed to export CSV");
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
}

export async function loginUser(credentials) {
  const raw = credentials && typeof credentials === "object" ? credentials : {};
  const ident = String(raw.email ?? raw.login ?? "").trim();
  const password = String(raw.password ?? "");
  const body = {
    email: ident,
    login: ident,
    password,
  };
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(
      normalizeErrorDetail(payload) || "Unable to sign in. Check your credentials."
    );
  }

  return response.json();
}

export async function registerUser(payload) {
  const response = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    throw new Error(normalizeErrorDetail(errorPayload) || "Registration failed");
  }

  return response.json();
}

export async function getDashboardData() {
  const response = await fetch(`${BASE_URL}/dashboard`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch dashboard data");
  }

  return response.json();
}

export async function getDashboardOverview() {
  const response = await authFetch(`${BASE_URL}/dashboard/overview`, {
    cache: "no-store",
    timeoutMs: 120000,
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throwNormalizedError(payload, "Failed to fetch dashboard overview");
  }
  return response.json();
}

export async function getQuarantine() {
  const response = await fetch(`${BASE_URL}/quarantine`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch quarantine data");
  }

  return response.json();
}

export async function getQuarantinePage({ offset = 0, limit = 50 } = {}) {
  const params = new URLSearchParams({
    offset: String(offset),
    limit: String(limit),
  });
  const response = await fetch(`${BASE_URL}/quarantine/paged?${params.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch quarantine data");
  }

  return response.json();
}

export async function exportQuarantineCsv() {
  await downloadCsv(`${BASE_URL}/quarantine/export`, "quarantine_records.csv", true);
}

export async function updateQuarantine(record) {
  const response = await authFetch(`${BASE_URL}/quarantine/update`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(record),
  });

  if (!response.ok) {
    throw new Error("Failed to update quarantine record");
  }

  return response.json();
}

/** Bulk import quarantine rows (admin). Each row: { name, email, error? }. */
export async function importQuarantineRows(rows) {
  const response = await authFetch(`${BASE_URL}/quarantine/import`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ rows }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throwNormalizedError(payload, "Failed to import quarantine rows");
  }

  return response.json();
}

export async function validateRulesSample({ name = "", email = "" } = {}) {
  const response = await authFetch(`${BASE_URL}/rules/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email }),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throwNormalizedError(payload, "Failed to validate sample row");
  }
  return response.json();
}

export async function getRules() {
  const response = await authFetch(`${BASE_URL}/rules`, {
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throwNormalizedError(payload, "Failed to fetch rules");
  }

  return response.json();
}

export async function addRule(ruleData) {
  const response = await authFetch(`${BASE_URL}/rules/add`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(ruleData),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throwNormalizedError(payload, "Failed to add rule");
  }

  return response.json();
}

export async function updateRule(ruleData) {
  const response = await authFetch(`${BASE_URL}/rules/update`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(ruleData),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throwNormalizedError(payload, "Failed to update rule");
  }

  return response.json();
}

export async function deleteRule(ruleId) {
  const response = await authFetch(`${BASE_URL}/rules/${ruleId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throwNormalizedError(payload, "Failed to delete rule");
  }

  return response.json();
}

export async function getUsers() {
  const response = await authFetch(`${BASE_URL}/users`, {
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throwNormalizedError(payload, "Failed to load users");
  }

  return response.json();
}

export async function updateUserRole(userId, role) {
  const response = await authFetch(`${BASE_URL}/users/${userId}/role`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ role }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throwNormalizedError(payload, "Failed to update role");
  }

  return response.json();
}

export async function updateUserStatus(userId, isActive) {
  const response = await authFetch(`${BASE_URL}/users/${userId}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ is_active: isActive }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throwNormalizedError(payload, "Failed to update status");
  }

  return response.json();
}

export async function getMyProfile() {
  const response = await authFetch(`${BASE_URL}/users/me`, {
    cache: "no-store",
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throwNormalizedError(payload, "Failed to load profile");
  }
  return response.json();
}

export async function updateMyProfile(payload) {
  const response = await authFetch(`${BASE_URL}/users/me`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errPayload = await response.json().catch(() => ({}));
    throwNormalizedError(errPayload, "Failed to update profile");
  }
  return response.json();
}

export async function updateMyPassword(payload) {
  const response = await authFetch(`${BASE_URL}/users/me/password`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errPayload = await response.json().catch(() => ({}));
    throwNormalizedError(errPayload, "Failed to update password");
  }
  return response.json();
}

export async function triggerSnowflakeSync() {
  const response = await authFetch(`${BASE_URL}/sync/snowflake`, {
    method: "POST",
    timeoutMs: 600000,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throwNormalizedError(payload, "Failed to trigger Snowflake sync");
  }

  return response.json();
}

export async function getSyncJobs() {
  const response = await fetch(`${BASE_URL}/sync/jobs`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch sync jobs");
  }

  return response.json();
}

export async function retrySyncJob(jobId) {
  const response = await authFetch(`${BASE_URL}/sync/jobs/${jobId}/retry`, {
    method: "POST",
    timeoutMs: 600000,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throwNormalizedError(payload, "Failed to retry sync job");
  }

  return response.json();
}

export async function getSchedulerJobs() {
  const response = await authFetch(`${BASE_URL}/scheduler`, {
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throwNormalizedError(payload, "Failed to fetch scheduler");
  }

  return response.json();
}

export async function configureSchedulerJob(payload) {
  const response = await authFetch(`${BASE_URL}/scheduler`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throwNormalizedError(data, "Failed to update scheduler");
  }

  return response.json();
}

export async function getAuditLogs({ action = "", user = "", limit = 200 } = {}) {
  const params = new URLSearchParams();
  if (action.trim()) {
    params.set("action", action.trim().toLowerCase());
  }
  if (user.trim()) {
    params.set("user", user.trim());
  }
  params.set("limit", String(limit));
  const qs = params.toString();
  const response = await authFetch(`${BASE_URL}/audit${qs ? `?${qs}` : ""}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throwNormalizedError(payload, "Failed to fetch audit logs");
  }

  return response.json();
}

export async function exportAuditCsv({ action = "", user = "", limit = 300 } = {}) {
  const params = new URLSearchParams();
  if (action.trim()) {
    params.set("action", action.trim().toLowerCase());
  }
  if (user.trim()) {
    params.set("user", user.trim());
  }
  params.set("limit", String(limit));
  await downloadCsv(`${BASE_URL}/audit/export?${params.toString()}`, "audit_logs.csv", true);
}

export async function runPipeline() {
  const response = await authFetch(`${BASE_URL}/pipeline/run`, {
    method: "POST",
    timeoutMs: 600000,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throwNormalizedError(payload, "Failed to run pipeline");
  }

  return response.json();
}

export async function getPipelineStatus() {
  const response = await authFetch(`${BASE_URL}/pipeline/status`, {
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throwNormalizedError(payload, "Failed to fetch pipeline status");
  }

  return response.json();
}

export async function getPipelineRuns() {
  const response = await authFetch(`${BASE_URL}/pipeline/runs`, {
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throwNormalizedError(payload, "Failed to fetch pipeline runs");
  }

  return response.json();
}

export async function getHealthStatus() {
  const response = await authFetch(`${BASE_URL}/health`, {
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throwNormalizedError(payload, "Failed to fetch health status");
  }

  return response.json();
}

/**
 * @param {{ offset?: number; limit?: number; status?: string }} params
 * @returns {Promise<{ items: unknown[]; total: number; offset: number; limit: number; pending_total: number }>}
 */
export async function exportStewardshipCsv({ status = "pending", maxRows = 50000 } = {}) {
  const params = new URLSearchParams({
    status: String(status || "pending"),
    max_rows: String(maxRows),
  });
  const safeStatus = String(status || "pending").replace(/[^a-z0-9_-]/gi, "_");
  await downloadCsv(
    `${BASE_URL}/stewardship/export?${params.toString()}`,
    `stewardship_queue_${safeStatus}.csv`,
    true,
    { timeoutMs: 120000 }
  );
}

export async function bulkApproveStewardship(ids) {
  const response = await authFetch(`${BASE_URL}/stewardship/bulk-approve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ids }),
    timeoutMs: 120000,
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throwNormalizedError(payload, "Bulk approve failed");
  }
  return response.json();
}

export async function bulkRejectStewardship(ids) {
  const response = await authFetch(`${BASE_URL}/stewardship/bulk-reject`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ids }),
    timeoutMs: 120000,
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throwNormalizedError(payload, "Bulk reject failed");
  }
  return response.json();
}

export async function getStewardshipPage({ offset = 0, limit = 50, status = "pending" } = {}) {
  const params = new URLSearchParams({
    offset: String(offset),
    limit: String(limit),
    status: String(status || "pending"),
  });
  const response = await authFetch(`${BASE_URL}/stewardship?${params.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throwNormalizedError(payload, "Failed to fetch stewardship records");
  }

  return response.json();
}

export async function getMasterDataPage({ offset = 0, limit = 50, q = "" } = {}) {
  const params = new URLSearchParams({
    offset: String(offset),
    limit: String(limit),
  });
  if (q.trim()) {
    params.set("q", q.trim());
  }
  const response = await authFetch(`${BASE_URL}/master-data?${params.toString()}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throwNormalizedError(payload, "Failed to fetch master data");
  }
  return response.json();
}

export async function getMasterDataCompare(sourceQueueId) {
  const response = await authFetch(
    `${BASE_URL}/master-data/compare/${sourceQueueId}`,
    { cache: "no-store" }
  );
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throwNormalizedError(payload, "Failed to load golden record comparison");
  }
  return response.json();
}

export async function getDuplicateCandidates({ minConfidence = 0.7, limit = 40 } = {}) {
  const params = new URLSearchParams({
    min_confidence: String(minConfidence),
    limit: String(limit),
  });
  const response = await authFetch(`${BASE_URL}/master-data/duplicates?${params.toString()}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throwNormalizedError(payload, "Failed to load duplicate candidates");
  }
  return response.json();
}

export async function mergeDuplicateCandidate(payload) {
  const response = await authFetch(`${BASE_URL}/master-data/duplicates/merge`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errPayload = await response.json().catch(() => ({}));
    throwNormalizedError(errPayload, "Failed to merge duplicate candidate");
  }
  return response.json();
}

export async function rejectDuplicateCandidate(payload) {
  const response = await authFetch(`${BASE_URL}/master-data/duplicates/reject`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errPayload = await response.json().catch(() => ({}));
    throwNormalizedError(errPayload, "Failed to dismiss duplicate candidate");
  }
  return response.json();
}

export async function uploadCsvAndStartIngestion(file) {
  if (!(file instanceof File)) {
    throw new Error("Please select a CSV file");
  }
  const form = new FormData();
  form.append("file", file);
  const response = await authFetch(`${BASE_URL}/ingestion/upload`, {
    method: "POST",
    body: form,
    timeoutMs: 300000,
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throwNormalizedError(payload, "Failed to upload CSV");
  }
  return response.json();
}

export async function getIngestionJob(jobId) {
  const response = await authFetch(`${BASE_URL}/ingestion/jobs/${jobId}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throwNormalizedError(payload, "Failed to fetch ingestion job");
  }
  return response.json();
}

export async function getLatestIngestionJob() {
  const response = await authFetch(`${BASE_URL}/ingestion/jobs/latest`, {
    cache: "no-store",
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throwNormalizedError(payload, "Failed to fetch latest ingestion job");
  }
  return response.json();
}

export async function listIngestionJobs({ limit = 20 } = {}) {
  const params = new URLSearchParams({ limit: String(limit) });
  const response = await authFetch(`${BASE_URL}/ingestion/jobs?${params.toString()}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throwNormalizedError(payload, "Failed to fetch ingestion jobs");
  }
  return response.json();
}

export async function getLineageGraph() {
  const response = await authFetch(`${BASE_URL}/lineage/graph`, {
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throwNormalizedError(payload, "Failed to fetch lineage graph");
  }

  return response.json();
}

export async function getLineageImpact({ nodeKey = "", field = "" } = {}) {
  const params = new URLSearchParams();
  if (nodeKey.trim()) {
    params.set("node_key", nodeKey.trim());
  }
  if (field.trim()) {
    params.set("field", field.trim());
  }
  const response = await authFetch(`${BASE_URL}/lineage/impact?${params.toString()}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throwNormalizedError(payload, "Failed to analyze lineage impact");
  }
  return response.json();
}

export async function getCatalogAssetLineageImpact(assetId) {
  const response = await authFetch(`${BASE_URL}/catalog/assets/${assetId}/lineage-impact`, {
    cache: "no-store",
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throwNormalizedError(payload, "Failed to fetch asset lineage impact");
  }
  return response.json();
}

export async function getCatalogAssets({ q = "", domain = "" } = {}) {
  const params = new URLSearchParams();
  if (q.trim()) {
    params.set("q", q.trim());
  }
  if (domain.trim()) {
    params.set("domain", domain.trim());
  }
  const qs = params.toString();
  const response = await authFetch(`${BASE_URL}/catalog/assets${qs ? `?${qs}` : ""}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throwNormalizedError(payload, "Failed to fetch catalog assets");
  }
  return response.json();
}

export async function createCatalogAsset(payload) {
  const response = await authFetch(`${BASE_URL}/catalog/assets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errPayload = await response.json().catch(() => ({}));
    throwNormalizedError(errPayload, "Failed to create catalog asset");
  }
  return response.json();
}

export async function getAiStatus() {
  const response = await authFetch(`${BASE_URL}/ai/status`, {
    cache: "no-store",
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throwNormalizedError(payload, "Failed to fetch AI status");
  }
  return response.json();
}

export async function explainQuarantineError(row) {
  const response = await authFetch(`${BASE_URL}/ai/actions/explain-quarantine`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: row?.name ?? "",
      email: row?.email ?? "",
      error: row?.error ?? "",
    }),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throwNormalizedError(payload, "Failed to explain quarantine error");
  }
  return response.json();
}

export async function getAiInsights() {
  const response = await authFetch(`${BASE_URL}/ai/insights`, {
    cache: "no-store",
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throwNormalizedError(payload, "Failed to fetch AI insights");
  }
  return response.json();
}

export async function runAiGenerateRules() {
  const response = await authFetch(`${BASE_URL}/ai/actions/generate-rules`, {
    method: "POST",
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throwNormalizedError(payload, "Failed to generate AI rules");
  }
  return response.json();
}

export async function runAiSuggestStewardshipOwners({ ids = [], assignAllPending = false } = {}) {
  const response = await authFetch(`${BASE_URL}/ai/actions/suggest-stewardship-owners`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ids: Array.isArray(ids) ? ids : [],
      assign_all_pending: Boolean(assignAllPending),
    }),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throwNormalizedError(payload, "Failed to generate stewardship owner suggestions");
  }
  return response.json();
}

export async function getAiActionLogs({
  offset = 0,
  limit = 50,
  actionKey = "",
  userId = "",
} = {}) {
  const params = new URLSearchParams();
  params.set("offset", String(offset));
  params.set("limit", String(limit));
  if (actionKey.trim()) {
    params.set("action_key", actionKey.trim());
  }
  if (userId.trim()) {
    params.set("user_id", userId.trim());
  }
  const response = await authFetch(`${BASE_URL}/ai/actions/logs?${params.toString()}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throwNormalizedError(payload, "Failed to fetch AI activity logs");
  }
  return response.json();
}

export async function getAiFailedJobsSummary() {
  const response = await authFetch(`${BASE_URL}/ai/actions/failed-jobs-summary`, {
    cache: "no-store",
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throwNormalizedError(payload, "Failed to summarize failed jobs");
  }
  return response.json();
}

export async function approveStewardship(id) {
  const response = await authFetch(`${BASE_URL}/stewardship/approve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throwNormalizedError(payload, "Failed to approve stewardship record");
  }

  return response.json();
}

export async function rejectStewardship(id) {
  const response = await authFetch(`${BASE_URL}/stewardship/reject`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throwNormalizedError(payload, "Failed to reject stewardship record");
  }

  return response.json();
}
