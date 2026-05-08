import { REFRESH_TOKEN_KEY, TOKEN_KEY } from "@/lib/authConstants";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
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

async function refreshAccessToken() {
  if (typeof window === "undefined") {
    return null;
  }
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) {
    return null;
  }
  const response = await fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
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
  const first = await fetch(url, {
    ...init,
    headers: {
      ...(init.headers || {}),
      ...getAuthHeaders(),
    },
  });
  if (first.status !== 401) {
    return first;
  }
  const refreshed = await refreshAccessToken();
  if (!refreshed) {
    return first;
  }
  return fetch(url, {
    ...init,
    headers: {
      ...(init.headers || {}),
      ...getAuthHeaders(),
    },
  });
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

async function downloadCsv(url, filename, withAuth = false) {
  const response = withAuth
    ? await authFetch(url)
    : await fetch(url);

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
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
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

export async function triggerSnowflakeSync() {
  const response = await fetch(`${BASE_URL}/sync/snowflake`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Failed to trigger Snowflake sync");
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
  const response = await fetch(`${BASE_URL}/sync/jobs/${jobId}/retry`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Failed to retry sync job");
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

export async function getStewardship() {
  const response = await authFetch(`${BASE_URL}/stewardship`, {
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throwNormalizedError(payload, "Failed to fetch stewardship records");
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

export async function runAiSuggestStewardshipOwners() {
  const response = await authFetch(`${BASE_URL}/ai/actions/suggest-stewardship-owners`, {
    method: "POST",
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throwNormalizedError(payload, "Failed to generate stewardship owner suggestions");
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
