"use client";

import { useTranslations } from "next-intl";
import { useAddEmployerForm } from "@/contexts/add-employer-form-context";
import type { RewardType } from "@/lib/types";

const rewardOptions: { type: RewardType; icon: string }[] = [
  { type: "hourly", icon: "⏱" },
  { type: "daily", icon: "📋" },
  { type: "global", icon: "💰" },
];

export default function AddEmployerStepTerms() {
  const t = useTranslations("addEmployer");
  const tc = useTranslations("common");
  const tContract = useTranslations("contract");
  const { form, errors, setField, computeMonthlySalary } =
    useAddEmployerForm();

  const inputClass = (field: string) =>
    `w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
      errors[field]
        ? "border-red-400 focus:border-red-500 focus:ring-red-500"
        : "border-gray-300 focus:border-teal-500 focus:ring-teal-500"
    }`;

  const estimatedSalary = computeMonthlySalary();

  return (
    <div className="space-y-5">
      {/* Reward Type Selection */}
      <div>
        <label className="mb-3 block text-sm font-medium text-gray-700">
          {t("rewardSection")}
        </label>
        <div className="space-y-2">
          {rewardOptions.map(({ type, icon }) => (
            <label
              key={type}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 transition-all ${
                form.rewardType === type
                  ? "border-teal-500 bg-teal-50 shadow-sm"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name="rewardType"
                value={type}
                checked={form.rewardType === type}
                onChange={() => setField("rewardType", type)}
                className="sr-only"
              />
              <span className="text-xl">{icon}</span>
              <div className="flex-1">
                <span className="block text-sm font-semibold text-gray-900">
                  {tContract(type)}
                </span>
                <span className="block text-xs text-gray-500">
                  {tContract(`${type}Desc`)}
                </span>
              </div>
              <div
                className={`h-4 w-4 rounded-full border-2 ${
                  form.rewardType === type
                    ? "border-teal-500 bg-teal-500"
                    : "border-gray-300"
                }`}
              >
                {form.rewardType === type && (
                  <div className="flex h-full w-full items-center justify-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-white" />
                  </div>
                )}
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Dynamic Pay Field */}
      {form.rewardType === "hourly" && (
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {t("hourlyRate")} ({tc("currency")}) *
          </label>
          <input
            type="number"
            min="0"
            value={form.hourlyRate === "" ? "" : form.hourlyRate}
            onChange={(e) =>
              setField(
                "hourlyRate",
                e.target.value ? Number(e.target.value) : ""
              )
            }
            className={inputClass("hourlyRate")}
          />
          {errors.hourlyRate && (
            <p className="mt-1 text-xs text-red-500">{t("requiredField")}</p>
          )}
        </div>
      )}

      {form.rewardType === "daily" && (
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {tContract("dailyRate")} ({tc("currency")}) *
          </label>
          <input
            type="number"
            min="0"
            value={form.dailyRate === "" ? "" : form.dailyRate}
            onChange={(e) =>
              setField(
                "dailyRate",
                e.target.value ? Number(e.target.value) : ""
              )
            }
            className={inputClass("dailyRate")}
          />
          {errors.dailyRate && (
            <p className="mt-1 text-xs text-red-500">{t("requiredField")}</p>
          )}
        </div>
      )}

      {form.rewardType === "global" && (
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {tContract("globalMonthlyAmount")} ({tc("currency")}) *
          </label>
          <input
            type="number"
            min="0"
            value={
              form.globalMonthlyAmount === "" ? "" : form.globalMonthlyAmount
            }
            onChange={(e) =>
              setField(
                "globalMonthlyAmount",
                e.target.value ? Number(e.target.value) : ""
              )
            }
            className={inputClass("globalMonthlyAmount")}
          />
          {errors.globalMonthlyAmount && (
            <p className="mt-1 text-xs text-red-500">{t("requiredField")}</p>
          )}
        </div>
      )}

      {/* Hours Per Week (not required for global) */}
      {form.rewardType !== "global" && (
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {t("hoursPerWeek")} *
          </label>
          <input
            type="number"
            min="0"
            value={form.hoursPerWeek === "" ? "" : form.hoursPerWeek}
            onChange={(e) =>
              setField(
                "hoursPerWeek",
                e.target.value ? Number(e.target.value) : ""
              )
            }
            className={inputClass("hoursPerWeek")}
          />
          {errors.hoursPerWeek && (
            <p className="mt-1 text-xs text-red-500">{t("requiredField")}</p>
          )}
        </div>
      )}

      {/* Estimated Monthly Salary Preview */}
      {estimatedSalary > 0 && form.rewardType !== "global" && (
        <div className="rounded-lg bg-teal-50 border border-teal-200 px-4 py-3">
          <p className="text-sm text-teal-700">
            <span className="font-medium">{t("estimatedMonthlySalary")}:</span>{" "}
            {tc("currency")}
            {estimatedSalary.toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}
