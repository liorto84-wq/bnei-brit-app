"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useEmployers } from "@/contexts/employer-context";
import type {
  ContractConfig,
  EmployerWithBenefits,
  RewardType,
} from "@/lib/types";

export default function ContractSetupModal({
  employer,
  onClose,
}: {
  employer: EmployerWithBenefits;
  onClose: () => void;
}) {
  const t = useTranslations("contract");
  const tc = useTranslations("common");
  const { getContractConfig, updateContractConfig } = useEmployers();

  const existing = getContractConfig(employer.id);

  const [rewardType, setRewardType] = useState<RewardType>(
    existing?.rewardType ?? "hourly"
  );
  const [noticeHours, setNoticeHours] = useState(
    existing?.cancellationPolicy.noticeHours ?? 24
  );
  const [shortNoticePayPercent, setShortNoticePayPercent] = useState(
    existing?.cancellationPolicy.shortNoticePayPercent ?? 100
  );
  const [dailyRate, setDailyRate] = useState(existing?.dailyRate ?? 0);
  const [globalMonthlyAmount, setGlobalMonthlyAmount] = useState(
    existing?.globalMonthlyAmount ?? employer.monthlySalary
  );
  const [notes, setNotes] = useState(existing?.notes ?? "");

  const handleSave = () => {
    const config: ContractConfig = {
      employerId: employer.id,
      rewardType,
      cancellationPolicy: {
        noticeHours,
        shortNoticePayPercent,
      },
      ...(rewardType === "daily" && { dailyRate }),
      ...(rewardType === "global" && { globalMonthlyAmount }),
      ...(notes.trim() && { notes: notes.trim() }),
    };
    updateContractConfig(config);
    onClose();
  };

  const rewardOptions: { type: RewardType; icon: string }[] = [
    { type: "hourly", icon: "⏱" },
    { type: "daily", icon: "📋" },
    { type: "global", icon: "💰" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="mb-6 text-lg font-semibold text-teal-900">
          {t("title")} — {employer.name}
        </h3>

        {/* Reward Type Selection */}
        <div className="mb-6">
          <label className="mb-3 block text-sm font-medium text-gray-700">
            {t("rewardType")}
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
                    {t(type)}
                  </span>
                  <span className="block text-xs text-gray-500">
                    {t(`${type}Desc`)}
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

        {/* Daily Rate (when daily is selected) */}
        {rewardType === "daily" && (
          <div className="mb-6">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t("dailyRate")} ({tc("currency")})
            </label>
            <input
              type="number"
              min="0"
              value={dailyRate || ""}
              onChange={(e) => setDailyRate(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
        )}

        {/* Global Monthly Amount (when global is selected) */}
        {rewardType === "global" && (
          <div className="mb-6">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t("globalMonthlyAmount")} ({tc("currency")})
            </label>
            <input
              type="number"
              min="0"
              value={globalMonthlyAmount || ""}
              onChange={(e) => setGlobalMonthlyAmount(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
        )}

        {/* Cancellation Policy */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <h4 className="mb-3 text-sm font-semibold text-gray-800">
            {t("cancellationPolicy")}
          </h4>

          <div className="mb-3">
            <label className="mb-1 block text-xs font-medium text-gray-600">
              {t("noticeHours")}
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
              {t("shortNoticePayPercent")}
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
            {t("shortNoticeExplanation", { hours: noticeHours })}
          </p>
        </div>

        {/* Notes */}
        <div className="mb-6">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {t("notes")}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("notesPlaceholder")}
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            {t("cancel")}
          </button>
          <button
            onClick={handleSave}
            className="flex-1 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
          >
            {t("save")}
          </button>
        </div>
      </div>
    </div>
  );
}
