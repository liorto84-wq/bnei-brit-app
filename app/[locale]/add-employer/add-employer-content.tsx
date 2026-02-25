"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useEmployers } from "@/contexts/employer-context";
import type { RewardType } from "@/lib/types";

export default function AddEmployerContent() {
  const t = useTranslations("addEmployer");
  const tc = useTranslations("common");
  const tContract = useTranslations("contract");
  const router = useRouter();
  const { addEmployer, updateContractConfig } = useEmployers();

  const [name, setName] = useState("");
  const [monthlySalary, setMonthlySalary] = useState<number | "">("");
  const [hoursPerWeek, setHoursPerWeek] = useState<number | "">("");
  const [startDate, setStartDate] = useState("");
  const [rewardType, setRewardType] = useState<RewardType>("hourly");
  const [dailyRate, setDailyRate] = useState<number | "">(0);
  const [globalMonthlyAmount, setGlobalMonthlyAmount] = useState<number | "">(
    ""
  );
  const [noticeHours, setNoticeHours] = useState(24);
  const [shortNoticePayPercent, setShortNoticePayPercent] = useState(100);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const rewardOptions: { type: RewardType; icon: string }[] = [
    { type: "hourly", icon: "⏱" },
    { type: "daily", icon: "📋" },
    { type: "global", icon: "💰" },
  ];

  const validate = () => {
    const newErrors: Record<string, boolean> = {};
    if (!name.trim()) newErrors.name = true;
    if (!monthlySalary || monthlySalary <= 0) newErrors.monthlySalary = true;
    if (!hoursPerWeek || hoursPerWeek <= 0) newErrors.hoursPerWeek = true;
    if (!startDate) newErrors.startDate = true;
    if (rewardType === "daily" && (!dailyRate || dailyRate <= 0))
      newErrors.dailyRate = true;
    if (
      rewardType === "global" &&
      (!globalMonthlyAmount || globalMonthlyAmount <= 0)
    )
      newErrors.globalMonthlyAmount = true;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const newEmployer = await addEmployer({
        name: name.trim(),
        monthlySalary: Number(monthlySalary),
        hoursPerWeek: Number(hoursPerWeek),
        startDate,
      });

      // Set contract config if non-default settings
      const hasCustomContract =
        rewardType !== "hourly" ||
        noticeHours !== 24 ||
        shortNoticePayPercent !== 100 ||
        notes.trim();
      if (hasCustomContract) {
        updateContractConfig({
          employerId: newEmployer.id,
          rewardType,
          cancellationPolicy: { noticeHours, shortNoticePayPercent },
          ...(rewardType === "daily" && { dailyRate: Number(dailyRate) }),
          ...(rewardType === "global" && {
            globalMonthlyAmount: Number(globalMonthlyAmount),
          }),
          ...(notes.trim() && { notes: notes.trim() }),
        });
      }

      router.push("/");
    } catch (err) {
      console.error("Failed to add employer:", err);
      setSaving(false);
    }
  };

  const inputClass = (field: string) =>
    `w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
      errors[field]
        ? "border-red-400 focus:border-red-500 focus:ring-red-500"
        : "border-gray-300 focus:border-teal-500 focus:ring-teal-500"
    }`;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-teal-900">{t("pageTitle")}</h2>
        <p className="text-teal-600">{t("pageSubtitle")}</p>
      </div>

      <div className="rounded-2xl border border-teal-100 bg-white p-6 shadow-sm">
        {/* Employer Details */}
        <h3 className="mb-4 text-lg font-semibold text-teal-900">
          {t("employerDetails")}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t("name")} *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("namePlaceholder")}
              className={inputClass("name")}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{t("requiredField")}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t("monthlySalary")} ({tc("currency")}) *
            </label>
            <input
              type="number"
              min="0"
              value={monthlySalary}
              onChange={(e) =>
                setMonthlySalary(e.target.value ? Number(e.target.value) : "")
              }
              className={inputClass("monthlySalary")}
            />
            {errors.monthlySalary && (
              <p className="mt-1 text-xs text-red-500">{t("requiredField")}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t("hoursPerWeek")} *
            </label>
            <input
              type="number"
              min="0"
              value={hoursPerWeek}
              onChange={(e) =>
                setHoursPerWeek(e.target.value ? Number(e.target.value) : "")
              }
              className={inputClass("hoursPerWeek")}
            />
            {errors.hoursPerWeek && (
              <p className="mt-1 text-xs text-red-500">{t("requiredField")}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t("startDate")} *
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={inputClass("startDate")}
            />
            {errors.startDate && (
              <p className="mt-1 text-xs text-red-500">{t("requiredField")}</p>
            )}
          </div>
        </div>

        {/* Reward Type Selection */}
        <div className="mt-6">
          <label className="mb-3 block text-sm font-medium text-gray-700">
            {t("rewardSection")}
          </label>
          <div className="space-y-2">
            {rewardOptions.map(({ type, icon }) => (
              <label
                key={type}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 transition-all ${
                  rewardType === type
                    ? "border-teal-500 bg-teal-50 shadow-sm"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="rewardType"
                  value={type}
                  checked={rewardType === type}
                  onChange={() => setRewardType(type)}
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
                    rewardType === type
                      ? "border-teal-500 bg-teal-500"
                      : "border-gray-300"
                  }`}
                >
                  {rewardType === type && (
                    <div className="flex h-full w-full items-center justify-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-white" />
                    </div>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Daily Rate */}
        {rewardType === "daily" && (
          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {tContract("dailyRate")} ({tc("currency")})
            </label>
            <input
              type="number"
              min="0"
              value={dailyRate || ""}
              onChange={(e) =>
                setDailyRate(e.target.value ? Number(e.target.value) : "")
              }
              className={inputClass("dailyRate")}
            />
            {errors.dailyRate && (
              <p className="mt-1 text-xs text-red-500">{t("requiredField")}</p>
            )}
          </div>
        )}

        {/* Global Monthly Amount */}
        {rewardType === "global" && (
          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {tContract("globalMonthlyAmount")} ({tc("currency")})
            </label>
            <input
              type="number"
              min="0"
              value={globalMonthlyAmount || ""}
              onChange={(e) =>
                setGlobalMonthlyAmount(
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

        {/* Cancellation Policy */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <h4 className="mb-3 text-sm font-semibold text-gray-800">
            {t("cancellationSection")}
          </h4>

          <div className="mb-3">
            <label className="mb-1 block text-xs font-medium text-gray-600">
              {tContract("noticeHours")}
            </label>
            <input
              type="number"
              min="1"
              max="72"
              value={noticeHours}
              onChange={(e) => setNoticeHours(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="mb-2">
            <label className="mb-1 block text-xs font-medium text-gray-600">
              {tContract("shortNoticePayPercent")}
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={shortNoticePayPercent}
                onChange={(e) =>
                  setShortNoticePayPercent(Number(e.target.value))
                }
                className="flex-1 accent-teal-600"
              />
              <span className="w-12 text-center text-sm font-semibold text-teal-700">
                {shortNoticePayPercent}%
              </span>
            </div>
          </div>

          <p className="text-xs text-gray-500">
            {tContract("shortNoticeExplanation", { hours: noticeHours })}
          </p>
        </div>

        {/* Notes */}
        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {tContract("notes")}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={tContract("notesPlaceholder")}
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => router.push("/")}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            {t("cancel")}
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
          >
            {saving ? t("saving") : t("submit")}
          </button>
        </div>
      </div>
    </div>
  );
}
