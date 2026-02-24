"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useEmployers } from "@/contexts/employer-context";
import { useVisitReporting } from "@/contexts/visit-reporting-context";
import { getUpcomingHolidays } from "@/lib/holidays";
import type { Holiday } from "@/lib/types";

export default function HolidayAlertModal() {
  const t = useTranslations("holiday");
  const { employers } = useEmployers();
  const { holidayDecisions, dismissedHolidays, recordHolidayDecision, dismissHoliday } =
    useVisitReporting();

  const upcomingHolidays = useMemo(() => getUpcomingHolidays(7), []);

  const [currentHoliday, setCurrentHoliday] = useState<Holiday | null>(null);

  // Find first undismissed holiday that still has employers without decisions
  useEffect(() => {
    for (const holiday of upcomingHolidays) {
      if (dismissedHolidays.has(holiday.key)) continue;

      const allDecided = employers.every((emp) =>
        holidayDecisions.some(
          (d) => d.holidayKey === holiday.key && d.employerId === emp.id
        )
      );

      if (!allDecided) {
        setCurrentHoliday(holiday);
        return;
      }
    }
    setCurrentHoliday(null);
  }, [upcomingHolidays, dismissedHolidays, holidayDecisions, employers]);

  if (!currentHoliday) return null;

  const decidedEmployerIds = new Set(
    holidayDecisions
      .filter((d) => d.holidayKey === currentHoliday.key)
      .map((d) => d.employerId)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="mb-1 text-lg font-semibold text-teal-900">
          {t("alertTitle")}
        </h3>
        <p className="mb-4 text-sm text-teal-600">
          {t("alertDescription", {
            holiday: t(currentHoliday.key),
            date: new Date(currentHoliday.date + "T00:00:00").toLocaleDateString(),
          })}
        </p>

        <div className="space-y-3">
          {employers.map((employer) => {
            const decided = decidedEmployerIds.has(employer.id);
            const decision = holidayDecisions.find(
              (d) =>
                d.holidayKey === currentHoliday.key &&
                d.employerId === employer.id
            );

            return (
              <div
                key={employer.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3"
              >
                <span className="text-sm font-medium text-gray-800">
                  {employer.name}
                </span>
                {decided && decision ? (
                  <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-medium text-teal-700">
                    {decision.decision === "cancel"
                      ? t("cancelVisit")
                      : t("reschedule")}
                  </span>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        recordHolidayDecision(
                          employer.id,
                          currentHoliday.date,
                          currentHoliday.key,
                          "cancel"
                        )
                      }
                      className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-200"
                    >
                      {t("cancelVisit")}
                    </button>
                    <button
                      onClick={() =>
                        recordHolidayDecision(
                          employer.id,
                          currentHoliday.date,
                          currentHoliday.key,
                          "reschedule"
                        )
                      }
                      className="rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-200"
                    >
                      {t("reschedule")}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={() => dismissHoliday(currentHoliday.key)}
          className="mt-4 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          {t("dismissAll")}
        </button>
      </div>
    </div>
  );
}
