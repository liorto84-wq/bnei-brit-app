"use client";

import { useTranslations } from "next-intl";
import { useAddEmployerForm } from "@/contexts/add-employer-form-context";

export default function AddEmployerStepIdentity() {
  const t = useTranslations("addEmployer");
  const { form, errors, setField } = useAddEmployerForm();

  const inputClass = (field: string) =>
    `w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
      errors[field]
        ? "border-red-400 focus:border-red-500 focus:ring-red-500"
        : "border-gray-300 focus:border-teal-500 focus:ring-teal-500"
    }`;

  return (
    <div className="space-y-5">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {t("name")} *
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setField("name", e.target.value)}
          placeholder={t("namePlaceholder")}
          className={inputClass("name")}
          autoFocus
        />
        {errors.name && (
          <p className="mt-1 text-xs text-red-500">{t("requiredField")}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {t("startDate")} *
        </label>
        <input
          type="date"
          value={form.startDate}
          onChange={(e) => setField("startDate", e.target.value)}
          className={inputClass("startDate")}
        />
        {errors.startDate && (
          <p className="mt-1 text-xs text-red-500">{t("requiredField")}</p>
        )}
      </div>
    </div>
  );
}
