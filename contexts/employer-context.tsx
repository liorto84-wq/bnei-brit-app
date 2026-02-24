"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { EmployerWithBenefits } from "@/lib/types";
import { mockEmployersWithBenefits } from "@/lib/mock-data";

interface EmployerContextValue {
  employers: EmployerWithBenefits[];
  totalBalance: number;
}

const EmployerContext = createContext<EmployerContextValue | null>(null);

export function EmployerProvider({ children }: { children: ReactNode }) {
  const employers = mockEmployersWithBenefits;

  const totalBalance = useMemo(
    () => employers.reduce((sum, emp) => sum + emp.totalMonthly, 0),
    [employers]
  );

  return (
    <EmployerContext value={{ employers, totalBalance }}>
      {children}
    </EmployerContext>
  );
}

export function useEmployers() {
  const context = useContext(EmployerContext);
  if (!context) {
    throw new Error("useEmployers must be used within an EmployerProvider");
  }
  return context;
}
