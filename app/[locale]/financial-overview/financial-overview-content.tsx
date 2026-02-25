"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useEmployers } from "@/contexts/employer-context";
import { useVisitReporting } from "@/contexts/visit-reporting-context";
import { useCompliance } from "@/contexts/compliance-context";
import {
  calculatePensionBreakdown,
  calculateQuarterlyEstimates,
} from "@/lib/pension-utils";

function LoadingSkeleton() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-4 py-8">
      <div className="mb-8">
        <div className="h-8 w-48 rounded bg-teal-100" />
        <div className="mt-2 h-5 w-64 rounded bg-teal-50" />
      </div>
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-teal-200" />
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-48 rounded-xl bg-gray-100" />
        ))}
      </div>
    </div>
  );
}

export default function FinancialOverviewContent() {
  const t = useTranslations("financial");
  const tc = useTranslations("common");
  const tComp = useTranslations("compliance");
  const { employers, totalBalance, isLoading, error } = useEmployers();
  const { completedSessions } = useVisitReporting();
  const { depositStatuses } = useCompliance();

  const totalSessionEarnings = useMemo(
    () =>
      completedSessions.reduce((sum, s) => sum + (s.earnings ?? 0), 0),
    [completedSessions]
  );

  const pendingCount = useMemo(() => {
    let count = 0;
    depositStatuses.forEach((d) => {
      if (d.status === "pending" || d.status === "overdue") count++;
    });
    return count;
  }, [depositStatuses]);

  const sessionsEarningsByQuarter = useMemo(() => {
    const quarters = [0, 0, 0, 0];
    for (const s of completedSessions) {
      if (!s.endTime || !s.earnings) continue;
      const month = new Date(s.endTime).getMonth();
      const qi = Math.floor(month / 3);
      quarters[qi] += s.earnings;
    }
    return quarters;
  }, [completedSessions]);

  const quarterlyEstimates = useMemo(
    () => calculateQuarterlyEstimates(totalBalance, sessionsEarningsByQuarter),
    [totalBalance, sessionsEarningsByQuarter]
  );

  // Per-employer session data
  const employerSessionData = useMemo(() => {
    const map = new Map<
      string,
      { earnings: number; count: number; totalHours: number }
    >();
    for (const s of completedSessions) {
      const existing = map.get(s.employerId) ?? {
        earnings: 0,
        count: 0,
        totalHours: 0,
      };
      existing.earnings += s.earnings ?? 0;
      existing.count += 1;
      if (s.startTime && s.endTime) {
        const ms =
          new Date(s.endTime).getTime() - new Date(s.startTime).getTime();
        existing.totalHours += ms / (1000 * 60 * 60);
      }
      map.set(s.employerId, existing);
    }
    return map;
  }, [completedSessions]);

  if (isLoading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="font-medium text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-teal-900">{t("pageTitle")}</h2>
        <p className="text-teal-600">{t("pageSubtitle")}</p>
      </div>

      {/* Summary Row */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-gradient-to-r from-teal-600 to-teal-700 p-5 text-white shadow-lg">
          <p className="text-sm font-medium text-teal-100">
            {t("totalMonthlyEarnings")}
          </p>
          <p className="mt-1 text-3xl font-bold">
            {tc("currency")}
            {totalBalance.toLocaleString()}
          </p>
        </div>

        <div className="rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 p-5 text-white shadow-lg">
          <p className="text-sm font-medium text-blue-100">
            {t("totalSessionEarnings")}
          </p>
          <p className="mt-1 text-3xl font-bold">
            {tc("currency")}
            {Math.round(totalSessionEarnings).toLocaleString()}
          </p>
        </div>

        <div className="rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 p-5 text-white shadow-lg">
          <p className="text-sm font-medium text-orange-100">
            {t("pendingItems")}
          </p>
          <p className="mt-1 text-3xl font-bold">{pendingCount}</p>
          <p className="mt-1 text-xs text-orange-200">
            {pendingCount === 0
              ? t("allDepositsCompliant")
              : t("noPendingItems") !== t("allDepositsCompliant")
                ? ""
                : ""}
          </p>
        </div>
      </div>

      {/* Per-Employer Breakdown */}
      <h3 className="mb-4 text-lg font-semibold text-teal-900">
        {t("perEmployerBreakdown")}
      </h3>
      <div className="mb-8 grid gap-6 md:grid-cols-2">
        {employers.map((emp) => {
          const pension = calculatePensionBreakdown(emp.id, emp.monthlySalary);
          const sessions = employerSessionData.get(emp.id);
          const deposit = depositStatuses.get(emp.id);
          const statusColors = {
            compliant: "bg-green-100 text-green-800",
            pending: "bg-yellow-100 text-yellow-800",
            overdue: "bg-red-100 text-red-800",
          };

          return (
            <div
              key={emp.id}
              className="rounded-2xl border border-teal-100 bg-white p-5 shadow-sm"
            >
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-base font-semibold text-teal-900">
                  {emp.name}
                </h4>
                {deposit && (
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[deposit.status]}`}
                  >
                    {tComp(deposit.status)}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                  <span className="text-gray-600">{tComp("totalPension")}</span>
                  <span className="font-semibold text-gray-900">
                    {tc("currency")}
                    {pension.totalMonthlyPension.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between rounded-lg bg-teal-50 px-3 py-2 text-sm">
                  <span className="text-teal-700">
                    {t("workSessionEarnings")}
                  </span>
                  <span className="font-semibold text-teal-800">
                    {sessions
                      ? `${tc("currency")}${Math.round(sessions.earnings).toLocaleString()}`
                      : t("noSessions")}
                  </span>
                </div>

                {sessions && (
                  <>
                    <div className="flex justify-between px-3 py-1 text-sm">
                      <span className="text-gray-500">
                        {t("sessionsCompleted")}
                      </span>
                      <span className="text-gray-700">{sessions.count}</span>
                    </div>
                    <div className="flex justify-between px-3 py-1 text-sm">
                      <span className="text-gray-500">
                        {t("totalHoursWorked")}
                      </span>
                      <span className="text-gray-700">
                        {Math.round(sessions.totalHours * 10) / 10}h
                      </span>
                    </div>
                  </>
                )}

                <div className="flex justify-between px-3 py-1 text-sm">
                  <span className="text-gray-500">
                    {t("pensionContributions")}
                  </span>
                  <span className="text-gray-700">
                    {tc("currency")}
                    {pension.employerContribution.toLocaleString()} +{" "}
                    {tc("currency")}
                    {pension.employeeContribution.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quarterly NI Summary */}
      <h3 className="mb-4 text-lg font-semibold text-teal-900">
        {t("quarterlyNI")}
      </h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quarterlyEstimates.map((q) => (
          <div
            key={q.quarter}
            className="rounded-2xl border border-teal-100 bg-white p-4 shadow-sm"
          >
            <p className="text-sm font-medium text-teal-600">
              {tComp("quarter")} {q.quarter}
            </p>
            <p className="mt-2 text-xl font-bold text-teal-900">
              {tc("currency")}
              {q.estimatedNIPayment.toLocaleString()}
            </p>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">
                  {tComp("estimatedEarnings")}
                </span>
                <span className="text-gray-700">
                  {tc("currency")}
                  {q.estimatedEarnings.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">
                  {tComp("sessionEarnings")}
                </span>
                <span className="text-gray-700">
                  {q.sessionsEarnings > 0
                    ? `${tc("currency")}${Math.round(q.sessionsEarnings).toLocaleString()}`
                    : tComp("noSessions")}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
