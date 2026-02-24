"use client";

import { useTranslations } from "next-intl";
import { useEmployers } from "@/contexts/employer-context";
import { useCompliance } from "@/contexts/compliance-context";
import { calculatePensionBreakdown } from "@/lib/pension-utils";

export default function PeaceOfMindView() {
  const t = useTranslations("compliance");
  const tc = useTranslations("common");
  const { employers } = useEmployers();
  const { depositStatuses, viewMode, setViewMode, markAsDeposited } =
    useCompliance();

  return (
    <div>
      <h3 className="mb-4 text-lg font-semibold text-teal-900">
        {t("peaceOfMindTitle")}
      </h3>

      {/* Worker / Employer toggle */}
      <div className="mb-6 flex rounded-lg bg-gray-100 p-1">
        <button
          onClick={() => setViewMode("worker")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            viewMode === "worker"
              ? "bg-white text-teal-700 shadow-sm"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          {t("workerView")}
        </button>
        <button
          onClick={() => setViewMode("employer")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            viewMode === "employer"
              ? "bg-white text-teal-700 shadow-sm"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          {t("employerView")}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {employers.map((employer) => {
          const deposit = depositStatuses.get(employer.id);
          const status = deposit?.status ?? "pending";
          const breakdown = calculatePensionBreakdown(
            employer.id,
            employer.monthlySalary
          );

          if (viewMode === "worker") {
            return (
              <div
                key={employer.id}
                className="rounded-xl border border-teal-100 bg-white p-5 shadow-sm"
              >
                <h4 className="mb-3 font-semibold text-teal-900">
                  {employer.name}
                </h4>
                <div className="flex items-center gap-2">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      status === "compliant" ? "bg-green-500" : "bg-yellow-500"
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      status === "compliant"
                        ? "text-green-700"
                        : "text-yellow-700"
                    }`}
                  >
                    {status === "compliant"
                      ? t("depositsConfirmed")
                      : t("depositsPending")}
                  </span>
                </div>
                {deposit?.lastDepositDate && (
                  <p className="mt-2 text-xs text-gray-500">
                    {t("lastDeposit")}: {deposit.lastDepositDate}
                  </p>
                )}
              </div>
            );
          }

          // Employer view
          return (
            <div
              key={employer.id}
              className="rounded-xl border border-teal-100 bg-white p-5 shadow-sm"
            >
              <h4 className="mb-3 font-semibold text-teal-900">
                {employer.name}
              </h4>
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="text-gray-600">{t("amountDue")}</span>
                <span className="font-bold text-gray-900">
                  {tc("currency")}
                  {breakdown.totalMonthlyPension.toLocaleString()}
                </span>
              </div>
              {status === "compliant" ? (
                <div className="rounded-lg bg-green-50 px-4 py-2 text-center text-sm font-medium text-green-700">
                  {t("paid")}
                </div>
              ) : (
                <button
                  onClick={() => markAsDeposited(employer.id)}
                  className="w-full rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
                >
                  {t("payNow")}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
