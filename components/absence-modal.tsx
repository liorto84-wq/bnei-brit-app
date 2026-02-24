"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useVisitReporting } from "@/contexts/visit-reporting-context";
import type { AbsenceType, EmployerWithBenefits } from "@/lib/types";

export default function AbsenceModal({
  employer,
  onClose,
}: {
  employer: EmployerWithBenefits;
  onClose: () => void;
}) {
  const t = useTranslations("absence");
  const { reportAbsence, getSickDaysUsed } = useVisitReporting();

  const [type, setType] = useState<AbsenceType>("sick_leave");
  const [date, setDate] = useState("");
  const [fileName, setFileName] = useState("");

  const sickDaysUsed = getSickDaysUsed(employer.id);
  const sickDaysAvailable =
    employer.benefits.sickLeaveAccumulated - sickDaysUsed;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileName(file ? file.name : "");
  };

  const handleSubmit = () => {
    if (!date) return;
    reportAbsence(
      employer.id,
      type,
      date,
      type === "sick_leave" ? fileName || undefined : undefined
    );
    onClose();
  };

  const absenceTypes: AbsenceType[] = ["sick_leave", "personal", "vacation"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold text-teal-900">
          {t("title")} — {employer.name}
        </h3>

        {/* Absence type selection */}
        <div className="mb-4 space-y-2">
          <label className="text-sm font-medium text-gray-700">
            {t("selectType")}
          </label>
          <div className="space-y-2">
            {absenceTypes.map((absenceType) => (
              <label
                key={absenceType}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 px-4 py-2 transition-colors hover:bg-gray-50"
              >
                <input
                  type="radio"
                  name="absenceType"
                  value={absenceType}
                  checked={type === absenceType}
                  onChange={() => setType(absenceType)}
                  className="text-teal-600"
                />
                <span className="text-sm text-gray-800">
                  {t(absenceType)}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Sick days info */}
        {type === "sick_leave" && (
          <div
            className={`mb-4 rounded-lg px-4 py-2 text-sm ${
              sickDaysAvailable <= 0
                ? "bg-red-50 text-red-700"
                : "bg-blue-50 text-blue-700"
            }`}
          >
            {sickDaysAvailable <= 0
              ? t("noSickDaysLeft")
              : `${t("available")}: ${sickDaysAvailable.toFixed(1)}`}
          </div>
        )}

        {/* Date picker */}
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {t("absenceDate")}
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        {/* File upload (sick leave only) */}
        {type === "sick_leave" && (
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t("medicalCertificate")}
            </label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="w-full text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-teal-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-teal-700 hover:file:bg-teal-100"
            />
            {fileName && (
              <p className="mt-1 text-xs text-gray-500">{fileName}</p>
            )}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            {t("cancel")}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!date}
            className="flex-1 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
          >
            {t("submit")}
          </button>
        </div>
      </div>
    </div>
  );
}
