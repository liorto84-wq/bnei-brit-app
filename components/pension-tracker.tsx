"use client";

import { useTranslations } from "next-intl";
import { useEmployers } from "@/contexts/employer-context";
import { useCompliance } from "@/contexts/compliance-context";
import { calculatePensionBreakdown } from "@/lib/pension-utils";
import {
  PENSION_EMPLOYER_RATE,
  PENSION_EMPLOYEE_RATE,
  PENSION_SEVERANCE_RATE,
} from "@/lib/constants";

const STATUS_STYLES: Record<string, string> = {
  compliant: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  overdue: "bg-red-100 text-red-800",
};

export default function PensionTracker() {
  const t = useTranslations("compliance");
  const tc = useTranslations("common");
  const { employers } = useEmployers();
  const { depositStatuses } = useCompliance();

  return (
    <div>
      <h3 className="mb-4 text-lg font-semibold text-teal-900">
        {t("pensionTitle")}
      </h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {employers.map((employer) => {
          const breakdown = calculatePensionBreakdown(
            employer.id,
            employer.monthlySalary
          );
          const deposit = depositStatuses.get(employer.id);
          const status = deposit?.status ?? "pending";

          return (
            <div
              key={employer.id}
              className="rounded-xl border border-teal-100 bg-white p-5 shadow-sm"
            >
              <div className="mb-3 flex items-center justify-between">
                <h4 className="font-semibold text-teal-900">
                  {employer.name}
                </h4>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
                >
                  {t(status)}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {t("employerContribution")}{" "}
                    <span className="text-gray-400">
                      ({t("rate")}: {(PENSION_EMPLOYER_RATE * 100).toFixed(1)}%)
                    </span>
                  </span>
                  <span className="font-medium text-gray-900">
                    {tc("currency")}
                    {breakdown.employerContribution.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {t("employeeContribution")}{" "}
                    <span className="text-gray-400">
                      ({t("rate")}: {(PENSION_EMPLOYEE_RATE * 100).toFixed(0)}%)
                    </span>
                  </span>
                  <span className="font-medium text-gray-900">
                    {tc("currency")}
                    {breakdown.employeeContribution.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {t("severance")}{" "}
                    <span className="text-gray-400">
                      ({t("rate")}: {(PENSION_SEVERANCE_RATE * 100).toFixed(0)}%)
                    </span>
                  </span>
                  <span className="font-medium text-gray-900">
                    {tc("currency")}
                    {breakdown.severanceContribution.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-teal-100 pt-3">
                <span className="text-sm font-medium text-teal-900">
                  {t("totalPension")}
                </span>
                <span className="text-lg font-bold text-teal-700">
                  {tc("currency")}
                  {breakdown.totalMonthlyPension.toLocaleString()}
                </span>
              </div>

              <div className="mt-2 text-xs text-gray-500">
                {t("lastDeposit")}:{" "}
                {deposit?.lastDepositDate ?? t("noDeposit")}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
