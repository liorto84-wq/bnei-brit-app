"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useEmployers } from "@/contexts/employer-context";
import { useChat } from "@/contexts/chat-context";
import {
  AddEmployerFormProvider,
  useAddEmployerForm,
} from "@/contexts/add-employer-form-context";
import AddEmployerStepper from "@/components/add-employer-stepper";
import AddEmployerStepIdentity from "@/components/add-employer-step-identity";
import AddEmployerStepTerms from "@/components/add-employer-step-terms";
import AddEmployerStepCancellation from "@/components/add-employer-step-cancellation";
import HelpTour from "@/components/help-tour";

function AddEmployerFormInner() {
  const t = useTranslations("addEmployer");
  const router = useRouter();
  const { addEmployer, updateContractConfig } = useEmployers();
  const { form, step, setStep, validateStep, computeMonthlySalary, setField } =
    useAddEmployerForm();
  const {
    registerFormFillCallback,
    unregisterFormFillCallback,
    showCompletionMessage,
  } = useChat();
  const [saving, setSaving] = useState(false);

  // Register form fill callback for chat guided setup
  useEffect(() => {
    registerFormFillCallback((field: string, value: string | number) => {
      setField(
        field as Parameters<typeof setField>[0],
        value as never
      );
    });
    return () => unregisterFormFillCallback();
  }, [registerFormFillCallback, unregisterFormFillCallback, setField]);

  const handleNext = useCallback(() => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  }, [step, validateStep, setStep]);

  const handleBack = useCallback(() => {
    setStep(step - 1);
  }, [step, setStep]);

  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    setSaving(true);
    try {
      const monthlySalary = computeMonthlySalary();
      const newEmployer = await addEmployer({
        name: form.name.trim(),
        monthlySalary,
        hoursPerWeek:
          form.rewardType === "global" ? 0 : Number(form.hoursPerWeek),
        startDate: form.startDate,
      });

      const hasCustomContract =
        form.rewardType !== "hourly" ||
        form.noticeHours !== 24 ||
        form.shortNoticePayPercent !== 100 ||
        form.notes.trim();
      if (hasCustomContract) {
        updateContractConfig({
          employerId: newEmployer.id,
          rewardType: form.rewardType,
          cancellationPolicy: {
            noticeHours: form.noticeHours,
            shortNoticePayPercent: form.shortNoticePayPercent,
          },
          ...(form.rewardType === "daily" && {
            dailyRate: Number(form.dailyRate),
          }),
          ...(form.rewardType === "global" && {
            globalMonthlyAmount: Number(form.globalMonthlyAmount),
          }),
          ...(form.notes.trim() && { notes: form.notes.trim() }),
        });
      }

      showCompletionMessage(form.name.trim());
      router.push("/");
    } catch (err) {
      console.error("Failed to add employer:", err);
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-teal-900">{t("pageTitle")}</h2>
        <p className="text-teal-600">{t("pageSubtitle")}</p>
      </div>

      <AddEmployerStepper currentStep={step} />

      <div className="rounded-2xl border border-teal-100 bg-white p-6 shadow-sm">
        {/* Step Title */}
        <h3 className="mb-5 text-lg font-semibold text-teal-900">
          {step === 1 && t("stepIdentity")}
          {step === 2 && t("stepTerms")}
          {step === 3 && t("stepCancellation")}
        </h3>

        {/* Step Content */}
        <div id={`step-content-${step}`}>
          {step === 1 && <AddEmployerStepIdentity />}
          {step === 2 && <AddEmployerStepTerms />}
          {step === 3 && <AddEmployerStepCancellation />}
        </div>

        {/* Navigation Buttons */}
        <div className="mt-6 flex gap-3">
          {step > 1 ? (
            <button
              onClick={handleBack}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              {t("back")}
            </button>
          ) : (
            <button
              onClick={() => router.push("/")}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              {t("cancel")}
            </button>
          )}

          {step < 3 ? (
            <button
              onClick={handleNext}
              className="flex-1 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700"
            >
              {t("next")}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
            >
              {saving ? t("saving") : t("submit")}
            </button>
          )}
        </div>
      </div>

      <HelpTour />
    </div>
  );
}

export default function AddEmployerContent() {
  return (
    <AddEmployerFormProvider>
      <AddEmployerFormInner />
    </AddEmployerFormProvider>
  );
}
