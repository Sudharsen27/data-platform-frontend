"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "@/components/Card";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { getDashboardData } from "@/lib/api";

function normalizeDashboardData(data) {
  return {
    successRate:
      data?.success_rate ??
      data?.successRate ??
      data?.kpis?.success_rate ??
      data?.kpis?.successRate ??
      0,
    failedRecords:
      data?.failed_records ??
      data?.failedRecords ??
      data?.kpis?.failed_records ??
      data?.kpis?.failedRecords ??
      0,
    activeJobs:
      data?.active_jobs ??
      data?.activeJobs ??
      data?.kpis?.active_jobs ??
      data?.kpis?.activeJobs ??
      0,
  };
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const data = await getDashboardData();
        setDashboardData(data);
      } catch (error) {
        setErrorMessage(error.message || "Unable to load dashboard data.");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const kpis = useMemo(() => {
    const normalized = normalizeDashboardData(dashboardData);

    return [
      {
        title: "Success Rate",
        value: `${normalized.successRate}%`,
        subtitle: "Data processing accuracy",
      },
      {
        title: "Failed Records",
        value: normalized.failedRecords,
        subtitle: "Records requiring attention",
      },
      {
        title: "Active Jobs",
        value: normalized.activeJobs,
        subtitle: "Running ingestion pipelines",
      },
    ];
  }, [dashboardData]);

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="flex min-h-screen flex-col md:flex-row">
        <Sidebar />
        <div className="flex-1">
          <Navbar />
          <main className="p-6">
            {isLoading ? (
              <div className="rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-500 shadow-sm">
                Loading dashboard data...
              </div>
            ) : errorMessage ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 shadow-sm">
                {errorMessage}
              </div>
            ) : (
              <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {kpis.map((kpi) => (
                  <Card
                    key={kpi.title}
                    title={kpi.title}
                    value={kpi.value}
                    subtitle={kpi.subtitle}
                  />
                ))}
              </section>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
