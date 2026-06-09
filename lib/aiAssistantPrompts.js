/** Page-aware suggested prompts for the global AI Assistant. */

const PAGE_PROMPTS = {
  dashboard: [
    "What is our governance score?",
    "Which datasets need attention?",
    "Show governance gaps",
    "Summarize governance assets",
    "What datasets contain customer information?",
    "Explain quality rules",
    "List available datasets",
  ],
  governance: [
    "What is our governance score?",
    "Which datasets need attention?",
    "Show governance gaps",
    "How is classification coverage?",
    "What is our stewardship resolution rate?",
    "Which domains have the lowest scores?",
    "What recommendations improve governance health?",
  ],
  catalog: [
    "Which datasets contain PII?",
    "Show sensitive fields",
    "Explain classification for customer_email",
    "What is customer_email?",
    "Show glossary definition for Customer Name",
    "Describe customer_master",
    "What is the purpose of this dataset?",
    "Show governance notes for this dataset",
    "Explain key fields",
    "What rules should apply to customer_email?",
    "Suggest quality checks for this dataset",
    "Which assets require masking?",
    "Show governance risks",
  ],
  lineage: [
    "What happens if Customer_ID changes?",
    "Show downstream dependencies",
    "Explain lineage impact",
    "Which assets are critical?",
    "Which reports are affected?",
  ],
  rules: [
    "Explain this rule",
    "Suggest improvements",
    "What rules should apply to customer_email?",
    "Suggest quality checks",
    "Show missing governance rules",
    "List active quality rules",
    "Which fields have validation rules?",
  ],
  stewardship: [
    "Why did this record fail?",
    "How can I fix this issue?",
    "What is the business impact?",
    "Show remediation suggestions",
    "Why was this record quarantined?",
    "Summarize pending stewardship tasks",
    "Who owns this task?",
  ],
  "master-data": [
    "Explain this master record",
    "Show golden record details",
    "What is the source of this record?",
    "Summarize master data quality",
  ],
  quarantine: [
    "Explain this quarantine error",
    "What rules caused this failure?",
    "Suggest how to fix this record",
    "Summarize quarantine issues",
  ],
  audit: [
    "Summarize recent governance activity",
    "What AI actions were performed?",
    "Explain audit events",
    "List stewardship approvals",
  ],
  flow: [
    "Explain the governance lifecycle",
    "Summarize governance assets",
    "What happens after quarantine?",
    "How does stewardship work?",
  ],
  duplicates: [
    "Explain duplicate detection",
    "How should I merge duplicates?",
    "Summarize duplicate reviews",
  ],
  default: [
    "What is Customer Master?",
    "Explain Customer_ID",
    "List available datasets",
    "Summarize governance assets",
  ],
};

export function resolvePageKey(pathname) {
  if (!pathname || pathname === "/") {
    return "dashboard";
  }
  const segment = pathname.split("/").filter(Boolean)[0] || "dashboard";
  return PAGE_PROMPTS[segment] ? segment : "default";
}

export function getSuggestedPrompts(pageKey, pageContext = {}) {
  const base = PAGE_PROMPTS[pageKey] || PAGE_PROMPTS.default;
  const contextual = [];

  if (pageKey === "catalog" && pageContext.asset_name) {
    contextual.push(`Explain ${pageContext.asset_name}`);
    contextual.push(`Show lineage for ${pageContext.asset_name}`);
  }
  if (pageKey === "lineage" && pageContext.node_key) {
    contextual.push(`Explain lineage for ${pageContext.node_label || pageContext.node_key}`);
    contextual.push("Show downstream dependencies");
  }
  if (pageKey === "rules" && pageContext.rule_field) {
    contextual.push(`Explain the rule on field ${pageContext.rule_field}`);
  }
  if (pageKey === "stewardship" && pageContext.task_name) {
    contextual.push(`Why was ${pageContext.task_name} sent to stewardship?`);
  }
  if (pageKey === "master-data" && pageContext.record_name) {
    contextual.push(`Explain master record for ${pageContext.record_name}`);
  }

  const merged = [...contextual, ...base];
  const seen = new Set();
  const unique = [];
  for (const prompt of merged) {
    if (!seen.has(prompt)) {
      seen.add(prompt);
      unique.push(prompt);
    }
  }
  return unique.slice(0, 6);
}

export function formatPageLabel(pageKey) {
  const labels = {
    dashboard: "Dashboard",
    governance: "Governance Health",
    catalog: "Catalog",
    lineage: "Lineage",
    rules: "Rules",
    stewardship: "Stewardship",
    "master-data": "Master Data",
    quarantine: "Quarantine",
    audit: "Audit",
    flow: "Governance Flow",
    duplicates: "Duplicates",
    "ai-activity": "AI Activity",
    upload: "Upload",
    jobs: "Jobs",
    pipeline: "Pipeline",
    users: "Users",
    profile: "Profile",
  };
  return labels[pageKey] || "Application";
}
