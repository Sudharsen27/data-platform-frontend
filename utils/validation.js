function isEmptyValue(value) {
  return String(value ?? "").trim() === "";
}

function applyRuleToField(fieldValue, fieldName, ruleText) {
  const normalizedRule = String(ruleText || "").toLowerCase();

  if (
    normalizedRule.includes("cannot be null") ||
    normalizedRule.includes("cannot be empty") ||
    normalizedRule.includes("required")
  ) {
    if (isEmptyValue(fieldValue)) {
      return `${fieldName} ${ruleText.toLowerCase()}`;
    }
  }

  if (fieldName.toLowerCase() === "email" && normalizedRule.includes("contain @")) {
    if (!String(fieldValue || "").includes("@")) {
      return "email must contain @";
    }
  }

  return "";
}

export function validateRowWithRules(row, rules) {
  const activeRules = (rules || []).filter((rule) => rule.status === "active");
  const fieldErrors = {};
  const errorMessages = [];

  activeRules.forEach((rule) => {
    const fieldName = String(rule.field || "").trim();
    if (!fieldName) {
      return;
    }

    const key = fieldName.toLowerCase();
    const fieldValue = row[key];
    const message = applyRuleToField(fieldValue, key, rule.rule || "");

    if (message) {
      fieldErrors[key] = true;
      errorMessages.push(message);
    }
  });

  return {
    fieldErrors,
    error: errorMessages.join(", "),
  };
}
