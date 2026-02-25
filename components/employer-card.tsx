"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { EmployerWithBenefits } from "@/lib/types";
import { useEmployers } from "@/contexts/employer-context";
import WorkSessionTimer from "./work-session-timer";
import AbsenceModal from "./absence-modal";
import ContractSetupModal from "./contract-setup-modal";
import EditEmployerModal from "./edit-employer-modal";

export default function EmployerCard({
  employer,
}: {
  employer: EmployerWithBenefits;
}) {
  const t = useTranslations("employer");
  const tc = useTranslations("common");
  const tContract = useTranslations("contract");
  const { getContractConfig } = useEmployers();
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const contractConfig = getContractConfig(employer.id);
  const rewardTypeLabels = {
    hourly: tContract("hourly"),
    daily: tContract("daily"),
    global: tContract("global"),
  };

  return (
    <>
      <div className="rounded-2xl border border-teal-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-teal-900">
                {employer.name}
              </h3>
              <button
                onClick={() => setShowEditModal(true)}
                className="rounded-md p-1 text-teal-500 transition-colors hover:bg-teal-50 hover:text-teal-700"
                title={t("editEmployer")}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-teal-600">
              {employer.hoursPerWeek} {tc("hours")}/{tc("perMonth")} ·{" "}
              {t("yearsEmployed")}: {employer.benefits.yearsEmployed}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="rounded-lg bg-teal-50 px-3 py-1 text-sm font-medium text-teal-700">
              {t("startDate")}: {new Date(employer.startDate).toLocaleDateString()}
            </div>
            {contractConfig && (
              <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-medium text-teal-800">
                {rewardTypeLabels[contractConfig.rewardType]}
              </span>
            )}
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

        <button
          onClick={() => setShowContractModal(true)}
          className="mt-2 w-full rounded-lg border border-teal-300 bg-teal-50 px-4 py-2 text-sm font-medium text-teal-700 transition-colors hover:bg-teal-100"
        >
          {tContract("contractSettings")}
        </button>
      </div>

      {showAbsenceModal && (
        <AbsenceModal
          employer={employer}
          onClose={() => setShowAbsenceModal(false)}
        />
      )}

      {showContractModal && (
        <ContractSetupModal
          employer={employer}
          onClose={() => setShowContractModal(false)}
        />
      )}

      {showEditModal && (
        <EditEmployerModal
          employer={employer}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </>
  );
}
