"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import type { RewardType } from "@/lib/types";

export interface AddEmployerFormState {
  name: string;
  startDate: string;
  rewardType: RewardType;
  hourlyRate: number | "";
  dailyRate: number | "";
  globalMonthlyAmount: number | "";
  hoursPerWeek: number | "";
  noticeHours: number;
  shortNoticePayPercent: number;
  notes: string;
}

const initialState: AddEmployerFormState = {
  name: "",
  startDate: "",
  rewardType: "hourly",
  hourlyRate: "",
  dailyRate: "",
  globalMonthlyAmount: "",
  hoursPerWeek: "",
  noticeHours: 24,
  shortNoticePayPercent: 100,
  notes: "",
};

type FormField = keyof AddEmployerFormState;

interface AddEmployerFormContextValue {
  form: AddEmployerFormState;
  step: number;
  errors: Record<string, boolean>;
  saving: boolean;
  setField: (field: FormField, value: AddEmployerFormState[FormField]) => void;
  setStep: (step: number) => void;
  validateStep: (step: number) => boolean;
  computeMonthlySalary: () => number;
}

const AddEmployerFormContext =
  createContext<AddEmployerFormContextValue | null>(null);

export function AddEmployerFormProvider({ children }: { children: ReactNode }) {
  const [form, setForm] = useState<AddEmployerFormState>(initialState);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [saving] = useState(false);

  const setField = useCallback(
    (field: FormField, value: AddEmployerFormState[FormField]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      // Clear error for this field when user types
      setErrors((prev) => {
        if (prev[field]) {
          const next = { ...prev };
          delete next[field];
          return next;
        }
        return prev;
      });
    },
    []
  );

  const validateStep = useCallback(
    (stepNum: number): boolean => {
      const newErrors: Record<string, boolean> = {};

      if (stepNum === 1) {
        if (!form.name.trim()) newErrors.name = true;
        if (!form.startDate) newErrors.startDate = true;
      }

      if (stepNum === 2) {
        if (form.rewardType === "hourly") {
          if (!form.hourlyRate || form.hourlyRate <= 0)
            newErrors.hourlyRate = true;
        }
        if (form.rewardType === "daily") {
          if (!form.dailyRate || form.dailyRate <= 0)
            newErrors.dailyRate = true;
        }
        if (form.rewardType === "global") {
          if (!form.globalMonthlyAmount || form.globalMonthlyAmount <= 0)
            newErrors.globalMonthlyAmount = true;
        }
        // hours required for hourly and daily
        if (form.rewardType !== "global") {
          if (!form.hoursPerWeek || form.hoursPerWeek <= 0)
            newErrors.hoursPerWeek = true;
        }
      }

      // Step 3 has defaults, no required validation

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [form]
  );

  const computeMonthlySalary = useCallback((): number => {
    if (form.rewardType === "hourly" && form.hourlyRate && form.hoursPerWeek) {
      return Math.round(
        Number(form.hourlyRate) * Number(form.hoursPerWeek) * 4.33
      );
    }
    if (form.rewardType === "daily" && form.dailyRate && form.hoursPerWeek) {
      return Math.round(
        Number(form.dailyRate) * (Number(form.hoursPerWeek) / 8) * 4.33
      );
    }
    if (form.rewardType === "global" && form.globalMonthlyAmount) {
      return Number(form.globalMonthlyAmount);
    }
    return 0;
  }, [form]);

  return (
    <AddEmployerFormContext
      value={{
        form,
        step,
        errors,
        saving,
        setField,
        setStep,
        validateStep,
        computeMonthlySalary,
      }}
    >
      {children}
    </AddEmployerFormContext>
  );
}

export function useAddEmployerForm() {
  const context = useContext(AddEmployerFormContext);
  if (!context) {
    throw new Error(
      "useAddEmployerForm must be used within AddEmployerFormProvider"
    );
  }
  return context;
}
