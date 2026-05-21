"use client";

import { useEffect, useState } from "react";
import PageShell from "@/components/layout/PageShell";
import RuleForm from "@/components/rules/RuleForm";
import RuleTable from "@/components/rules/RuleTable";
import { addRule, deleteRule, getRules, updateRule, validateRulesSample } from "@/lib/api";
import { useRequireAdmin } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Toast from "@/components/ui/Toast";
import Spinner from "@/components/ui/Spinner";
import Breadcrumbs from "@/components/ui/Breadcrumbs";

export default function RulesPage() {
  const { isCheckingAuth } = useRequireAdmin();
  const { isReady, isAuthenticated, isAdmin } = useAuth();
  const [rules, setRules] = useState([]);
  const [editingRule, setEditingRule] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [testName, setTestName] = useState("User 7");
  const [testEmail, setTestEmail] = useState("user7");
  const [testResult, setTestResult] = useState(null);
  const [isTestingRules, setIsTestingRules] = useState(false);

  useEffect(() => {
    if (!isReady || !isAuthenticated || !isAdmin) {
      return;
    }

    async function loadRules() {
      try {
        setIsLoading(true);
        setErrorMessage("");
        const data = await getRules();
        setRules(data);
      } catch (error) {
        setErrorMessage(error.message || "Failed to load rules.");
      } finally {
        setIsLoading(false);
      }
    }

    loadRules();
  }, [isReady, isAuthenticated, isAdmin]);

  useEffect(() => {
    if (!message && !errorMessage) {
      return;
    }

    const timer = setTimeout(() => {
      setMessage("");
      setErrorMessage("");
    }, 2500);

    return () => clearTimeout(timer);
  }, [message, errorMessage]);

  async function handleSaveRule(ruleData) {
    try {
      setIsSubmitting(true);
      setErrorMessage("");
      setMessage("");

      if (editingRule) {
        const response = await updateRule({ id: editingRule.id, ...ruleData });
        setRules((currentRules) =>
          currentRules.map((ruleItem) =>
            ruleItem.id === editingRule.id ? response.rule : ruleItem
          )
        );
        setMessage("Rule updated successfully.");
        setEditingRule(null);
        return;
      }

      const response = await addRule(ruleData);
      setRules((currentRules) => [...currentRules, response.rule]);
      setMessage("Rule added successfully.");
    } catch (error) {
      setErrorMessage(error.message || "Failed to save rule.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleEditRule(ruleItem) {
    setEditingRule(ruleItem);
  }

  async function handleDeleteRule(ruleId) {
    try {
      setDeletingId(ruleId);
      setErrorMessage("");
      setMessage("");
      await deleteRule(ruleId);
      setRules((currentRules) =>
        currentRules.filter((ruleItem) => ruleItem.id !== ruleId)
      );
      setMessage("Rule deleted successfully.");
      if (editingRule?.id === ruleId) {
        setEditingRule(null);
      }
    } catch (error) {
      setErrorMessage(error.message || "Failed to delete rule.");
    } finally {
      setDeletingId(null);
    }
  }

  function handleCancelEdit() {
    setEditingRule(null);
  }

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-sm text-zinc-600">
        Checking authentication...
      </div>
    );
  }

  return (
    <>
      <Toast message={message} type="success" />
      <Toast message={errorMessage} type="error" />
      <PageShell title="Rules Engine">
            <Breadcrumbs items={[{ label: "Home" }, { label: "Rules", current: true }]} />
            <section>
              <h2 className="text-lg font-semibold text-zinc-900">Data Rules</h2>
              <p className="mt-1 text-sm text-zinc-600">
                Active rules run automatically when you execute the pipeline on quarantine data.
              </p>
            </section>

            <Card title="Test rules on a sample row" subtitle="Preview violations before running the full pipeline">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm text-zinc-700">
                  Name
                  <input
                    className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                  />
                </label>
                <label className="text-sm text-zinc-700">
                  Email
                  <input
                    className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                  />
                </label>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={isTestingRules}
                  onClick={async () => {
                    try {
                      setIsTestingRules(true);
                      setErrorMessage("");
                      const result = await validateRulesSample({
                        name: testName,
                        email: testEmail,
                      });
                      setTestResult(result);
                    } catch (error) {
                      setErrorMessage(error.message || "Validation failed.");
                    } finally {
                      setIsTestingRules(false);
                    }
                  }}
                >
                  {isTestingRules ? "Testing…" : "Run validation"}
                </Button>
                {testResult ? (
                  <span className="text-xs text-zinc-600">
                    {testResult.active_rules} active rule(s) —{" "}
                    {testResult.error ? (
                      <span className="font-medium text-rose-700">{testResult.error}</span>
                    ) : (
                      <span className="font-medium text-emerald-700">Pass</span>
                    )}
                  </span>
                ) : null}
              </div>
            </Card>

            <section className="grid gap-6 xl:grid-cols-[380px_1fr]">
              <RuleForm
                key={editingRule ? `edit-${editingRule.id}` : "create-rule"}
                editingRule={editingRule}
                onSave={handleSaveRule}
                onCancel={handleCancelEdit}
                isSubmitting={isSubmitting}
              />
              <div className="space-y-4">
                {isLoading ? (
                  <Card>
                    <div className="flex items-center gap-2 text-sm text-zinc-600">
                      <Spinner />
                      Loading rules...
                    </div>
                  </Card>
                ) : (
                  <RuleTable
                    rules={rules}
                    onEdit={handleEditRule}
                    onDelete={handleDeleteRule}
                    deletingId={deletingId}
                  />
                )}
              </div>
            </section>
      </PageShell>
    </>
  );
}
