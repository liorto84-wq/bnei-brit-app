"use client";

import { useTranslations } from "next-intl";
import { useAddEmployerForm } from "@/contexts/add-employer-form-context";

export default function AddEmployerStepCancellation() {
  const tContract = useTranslations("contract");
  const { form, setField } = useAddEmployerForm();

  return (
    <div className="space-y-5">
      {/* Notice Hours */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {tContract("noticeHours")}
        </label>
        <input
          type="number"
          min="1"
          max="72"
          value={form.noticeHours}
          onChange={(e) => setField("noticeHours", Number(e.target.value))}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
        />
      </div>

      {/* Short Notice Pay Percent */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {tContract("shortNoticePayPercent")}
        </label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={form.shortNoticePayPercent}
            onChange={(e) =>
              setField("shortNoticePayPercent", Number(e.target.value))
            }
            className="flex-1 accent-teal-600"
          />
          <span className="w-12 text-center text-sm font-semibold text-teal-700">
            {form.shortNoticePayPercent}%
          </span>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          {tContract("shortNoticeExplanation", {
            hours: form.noticeHours,
          })}
        </p>
      </div>

      {/* Notes */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {tContract("notes")}
        </label>
        <textarea
          value={form.notes}
          onChange={(e) => setField("notes", e.target.value)}
          placeholder={tContract("notesPlaceholder")}
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
        />
      </div>
    </div>
  );
}
