"use client";

import { useTranslations } from "next-intl";

interface AddEmployerStepperProps {
  currentStep: number;
}

const steps = [
  { key: "stepIdentity", id: "step-identity" },
  { key: "stepTerms", id: "step-terms" },
  { key: "stepCancellation", id: "step-cancellation" },
] as const;

export default function AddEmployerStepper({
  currentStep,
}: AddEmployerStepperProps) {
  const t = useTranslations("addEmployer");

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNum = index + 1;
          const isActive = stepNum === currentStep;
          const isCompleted = stepNum < currentStep;

          return (
            <div
              key={step.key}
              id={step.id}
              className="flex flex-1 items-center"
            >
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all ${
                    isCompleted
                      ? "bg-teal-600 text-white"
                      : isActive
                        ? "bg-teal-600 text-white ring-4 ring-teal-100"
                        : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {isCompleted ? (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    stepNum
                  )}
                </div>
                <span
                  className={`mt-2 text-xs font-medium ${
                    isActive || isCompleted
                      ? "text-teal-700"
                      : "text-gray-400"
                  }`}
                >
                  {t(step.key)}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`mx-2 h-0.5 flex-1 transition-colors ${
                    stepNum < currentStep ? "bg-teal-500" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
