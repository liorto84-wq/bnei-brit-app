"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { EmployerWithBenefits } from "@/lib/types";
import WorkSessionTimer from "./work-session-timer";
import AbsenceModal from "./absence-modal";

export default function EmployerCard({
  employer,
}: {
  employer: EmployerWithBenefits;
}) {
  const t = useTranslations("employer");
  const tc = useTranslations("common");
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);

  return (
    <>
      <div className="rounded-2xl border border-teal-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-teal-900">
              {employer.name}
            </h3>
            <p className="text-sm text-teal-600">
              {employer.hoursPerWeek} {tc("hours")}/{tc("perMonth")} ·{" "}
              {t("yearsEmployed")}: {employer.benefits.yearsEmployed}
            </p>
          </div>
          <div className="rounded-lg bg-teal-50 px-3 py-1 text-sm font-medium text-teal-700">
            {t("startDate")}: {new Date(employer.startDate).toLocaleDateString()}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2">
            <span className="text-sm text-gray-600">{t("monthlySalary")}</span>
            <span className="font-semibold text-gray-900">
              {tc("currency")}
              {employer.monthlySalary.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-teal-50 px-4 py-2">
            <span className="text-sm text-teal-700">
              {t("convalescencePerMonth")}
            </span>
            <span className="font-semibold text-teal-800">
              {tc("currency")}
              {employer.benefits.convalescencePayPerMonth.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-blue-50 px-4 py-2">
            <span className="text-sm text-blue-700">
              {t("sickLeaveAccumulated")}
            </span>
            <span className="font-semibold text-blue-800">
              {employer.benefits.sickLeaveAccumulated} {tc("days")}
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-teal-100 pt-4">
          <span className="font-medium text-teal-900">{t("totalMonthly")}</span>
          <span className="text-xl font-bold text-teal-700">
            {tc("currency")}
            {employer.totalMonthly.toLocaleString()}
          </span>
        </div>

        {/* Work Session Timer */}
        <WorkSessionTimer employer={employer} />

        {/* Report Absence Button */}
        <button
          onClick={() => setShowAbsenceModal(true)}
          className="mt-3 w-full rounded-lg border border-orange-300 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700 transition-colors hover:bg-orange-100"
        >
          {t("reportAbsence")}
        </button>
      </div>

      {showAbsenceModal && (
        <AbsenceModal
          employer={employer}
          onClose={() => setShowAbsenceModal(false)}
        />
      )}
    </>
  );
}
