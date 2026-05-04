"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import RuleForm from "@/components/rules/RuleForm";
import RuleTable from "@/components/rules/RuleTable";
import { addRule, deleteRule, getRules, updateRule } from "@/lib/api";
import { useRequireAdmin } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";
import Card from "@/components/ui/Card";
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
    <div className="min-h-screen bg-zinc-50">
      <Toast message={message} type="success" />
      <Toast message={errorMessage} type="error" />
      <div className="flex min-h-screen flex-col md:flex-row">
        <Sidebar />
        <div className="flex-1">
          <Navbar title="Rules Engine" />
          <main className="space-y-6 p-6">
            <Breadcrumbs items={[{ label: "Home" }, { label: "Rules", current: true }]} />
            <section>
              <h2 className="text-lg font-semibold text-zinc-900">Data Rules</h2>
              <p className="mt-1 text-sm text-zinc-600">
                Manage validation rules for incoming records.
              </p>
            </section>

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
          </main>
        </div>
      </div>
    </div>
  );
}
