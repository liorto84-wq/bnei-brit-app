"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

const TOUR_DISMISSED_KEY = "addEmployerTourDismissed";

const tourSteps = [
  {
    targetId: "step-identity",
    titleKey: "tourIdentityTitle" as const,
    descKey: "tourIdentityDesc" as const,
  },
  {
    targetId: "step-terms",
    titleKey: "tourTermsTitle" as const,
    descKey: "tourTermsDesc" as const,
  },
  {
    targetId: "step-cancellation",
    titleKey: "tourCancelTitle" as const,
    descKey: "tourCancelDesc" as const,
  },
];

export default function HelpTour() {
  const t = useTranslations("tour");
  const [currentTourStep, setCurrentTourStep] = useState(0);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    // Check localStorage on mount
    try {
      const wasDismissed = localStorage.getItem(TOUR_DISMISSED_KEY);
      if (!wasDismissed) {
        setDismissed(false);
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  const dismiss = useCallback(() => {
    setDismissed(true);
    try {
      localStorage.setItem(TOUR_DISMISSED_KEY, "true");
    } catch {
      // localStorage unavailable
    }
  }, []);

  const handleNext = useCallback(() => {
    if (currentTourStep < tourSteps.length - 1) {
      setCurrentTourStep((prev) => prev + 1);
    } else {
      dismiss();
    }
  }, [currentTourStep, dismiss]);

  if (dismissed) return null;

  const step = tourSteps[currentTourStep];
  const isLast = currentTourStep === tourSteps.length - 1;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/30" onClick={dismiss} />

      {/* Tooltip */}
      <div className="fixed inset-x-4 bottom-24 z-50 mx-auto max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
        <div className="mb-1 flex items-center justify-between">
          <h4 className="text-sm font-bold text-teal-900">
            {t(step.titleKey)}
          </h4>
          <button
            onClick={dismiss}
            className="text-gray-400 hover:text-gray-600"
            aria-label={t("tourSkip")}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <p className="mb-4 text-xs text-gray-600">{t(step.descKey)}</p>

        <div className="flex items-center justify-between">
          {/* Step dots */}
          <div className="flex gap-1.5">
            {tourSteps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-1.5 rounded-full ${
                  i === currentTourStep ? "bg-teal-600" : "bg-gray-300"
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={dismiss}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700"
            >
              {t("tourSkip")}
            </button>
            <button
              onClick={handleNext}
              className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-700"
            >
              {isLast ? t("tourFinish") : t("tourNext")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
