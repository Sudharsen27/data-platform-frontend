const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function getAuthHeaders() {
  if (typeof window === "undefined") {
    return {};
  }

  const token = localStorage.getItem("mdm_auth_token");
  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
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
    throw new Error("Invalid email or password");
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

export async function getQuarantine() {
  const response = await fetch(`${BASE_URL}/quarantine`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch quarantine data");
  }

  return response.json();
}

export async function updateQuarantine(record) {
  const response = await fetch(`${BASE_URL}/quarantine/update`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(record),
  });

  if (!response.ok) {
    throw new Error("Failed to update quarantine record");
  }

  return response.json();
}

export async function getRules() {
  const response = await fetch(`${BASE_URL}/rules`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch rules");
  }

  return response.json();
}

export async function addRule(ruleData) {
  const response = await fetch(`${BASE_URL}/rules/add`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(ruleData),
  });

  if (!response.ok) {
    throw new Error("Failed to add rule");
  }

  return response.json();
}

export async function updateRule(ruleData) {
  const response = await fetch(`${BASE_URL}/rules/update`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(ruleData),
  });

  if (!response.ok) {
    throw new Error("Failed to update rule");
  }

  return response.json();
}

export async function deleteRule(ruleId) {
  const response = await fetch(`${BASE_URL}/rules/${ruleId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete rule");
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

export async function getAuditLogs() {
  const response = await fetch(`${BASE_URL}/audit/logs`, {
    cache: "no-store",
    headers: {
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch audit logs");
  }

  return response.json();
}
