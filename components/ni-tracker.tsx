"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useEmployers } from "@/contexts/employer-context";
import { useVisitReporting } from "@/contexts/visit-reporting-context";
import { calculateQuarterlyEstimates } from "@/lib/pension-utils";

export default function NITracker() {
  const t = useTranslations("compliance");
  const tc = useTranslations("common");
  const { employers } = useEmployers();
  const { completedSessions } = useVisitReporting();

  const totalMonthlySalary = useMemo(
    () => employers.reduce((sum, emp) => sum + emp.monthlySalary, 0),
    [employers]
  );

  const sessionsEarningsByQuarter = useMemo(() => {
    const quarters = [0, 0, 0, 0];
    completedSessions.forEach((session) => {
      if (session.earnings && session.endTime) {
        const month = new Date(session.endTime).getMonth();
        const qi = Math.floor(month / 3);
        quarters[qi] += session.earnings;
      }
    });
    return quarters;
  }, [completedSessions]);

  const estimates = useMemo(
    () => calculateQuarterlyEstimates(totalMonthlySalary, sessionsEarningsByQuarter),
    [totalMonthlySalary, sessionsEarningsByQuarter]
  );

  return (
    <div>
      <h3 className="mb-4 text-lg font-semibold text-teal-900">
        {t("niTitle")}
      </h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {estimates.map((est) => (
          <div
            key={est.quarter}
            className="rounded-xl border border-teal-100 bg-white p-5 shadow-sm"
          >
            <div className="mb-3 text-center">
              <span className="text-sm font-medium text-teal-600">
                {t("quarter")} {est.quarter}
              </span>
              <span className="ms-1 text-xs text-gray-400">{est.year}</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{t("estimatedEarnings")}</span>
                <span className="font-medium text-gray-900">
                  {tc("currency")}
                  {est.estimatedEarnings.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{t("estimatedNI")}</span>
                <span className="font-bold text-teal-700">
                  {tc("currency")}
                  {est.estimatedNIPayment.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{t("sessionEarnings")}</span>
                <span className="font-medium text-gray-900">
                  {est.sessionsEarnings > 0 ? (
                    <>
                      {tc("currency")}
                      {est.sessionsEarnings.toLocaleString()}
                    </>
                  ) : (
                    <span className="text-gray-400">{t("noSessions")}</span>
                  )}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
