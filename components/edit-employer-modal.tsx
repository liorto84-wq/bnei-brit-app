"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useEmployers } from "@/contexts/employer-context";
import type { EmployerWithBenefits } from "@/lib/types";

export default function EditEmployerModal({
  employer,
  onClose,
}: {
  employer: EmployerWithBenefits;
  onClose: () => void;
}) {
  const t = useTranslations("employer");
  const tc = useTranslations("common");
  const tAdd = useTranslations("addEmployer");
  const tContract = useTranslations("contract");
  const { updateEmployer } = useEmployers();

  const [name, setName] = useState(employer.name);
  const [monthlySalary, setMonthlySalary] = useState(employer.monthlySalary);
  const [hoursPerWeek, setHoursPerWeek] = useState(employer.hoursPerWeek);
  const [startDate, setStartDate] = useState(employer.startDate);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateEmployer(employer.id, {
        name: name.trim(),
        monthlySalary,
        hoursPerWeek,
        startDate,
      });
      onClose();
    } catch (err) {
      console.error("Failed to update employer:", err);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="mb-6 text-lg font-semibold text-teal-900">
          {t("editTitle")} — {employer.name}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {tAdd("name")}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t("monthlySalary")} ({tc("currency")})
            </label>
            <input
              type="number"
              min="0"
              value={monthlySalary}
              onChange={(e) => setMonthlySalary(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t("hoursPerWeek")}
            </label>
            <input
              type="number"
              min="0"
              value={hoursPerWeek}
              onChange={(e) => setHoursPerWeek(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t("startDate")}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            {tContract("cancel")}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="flex-1 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
          >
            {t("saveChanges")}
          </button>
        </div>
      </div>
    </div>
  );
}
