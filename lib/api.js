const BASE_URL = "http://127.0.0.1:8000";

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
