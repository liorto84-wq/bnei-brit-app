"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useVisitReporting } from "@/contexts/visit-reporting-context";
import { formatElapsedTime, getHourlyRate } from "@/lib/utils";
import type { EmployerWithBenefits } from "@/lib/types";

export default function WorkSessionTimer({
  employer,
}: {
  employer: EmployerWithBenefits;
}) {
  const t = useTranslations("timer");
  const tc = useTranslations("common");
  const { activeSessions, startSession, endSession, getLastSession } =
    useVisitReporting();

  const activeSession = activeSessions.get(employer.id);
  const lastSession = getLastSession(employer.id);
  const hourlyRate = getHourlyRate(employer);

  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!activeSession) {
      setElapsed(0);
      return;
    }
    const tick = () => {
      setElapsed(Date.now() - new Date(activeSession.startTime).getTime());
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  const currentEarnings =
    Math.round((elapsed / (1000 * 60 * 60)) * hourlyRate * 100) / 100;

  return (
    <div className="mt-4 rounded-lg border border-teal-200 bg-teal-50/50 p-3">
      <div className="mb-2 flex items-center justify-between text-xs text-teal-600">
        <span>
          {t("hourlyRate")}: {tc("currency")}
          {hourlyRate.toFixed(1)}
        </span>
      </div>

      {activeSession ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-teal-800">
              {t("activeSession")}
            </span>
            <span className="font-mono text-lg font-bold text-teal-900">
              {formatElapsedTime(elapsed)}
            </span>
          </div>
          <div className="text-sm text-teal-700">
            {t("currentEarnings")}: {tc("currency")}
            {currentEarnings.toFixed(2)}
          </div>
          <button
            onClick={() => endSession(employer.id)}
            className="w-full rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
          >
            {t("endSession")}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {lastSession && lastSession.earnings !== undefined && (
            <div className="rounded-md bg-white px-3 py-2 text-sm text-teal-700">
              {t("lastSession")}: {tc("currency")}
              {lastSession.earnings.toFixed(2)}
            </div>
          )}
          <button
            onClick={() => startSession(employer.id)}
            className="w-full rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
          >
            {t("startSession")}
          </button>
        </div>
      )}
    </div>
  );
}
