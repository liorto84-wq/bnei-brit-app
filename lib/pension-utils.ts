import type { PensionBreakdown, QuarterlyNIEstimate } from "./types";
import {
  PENSION_EMPLOYER_RATE,
  PENSION_EMPLOYEE_RATE,
  PENSION_SEVERANCE_RATE,
  NI_REDUCED_RATE_THRESHOLD,
  NI_REDUCED_RATE,
  NI_FULL_RATE,
} from "./constants";

export function calculatePensionBreakdown(
  employerId: string,
  monthlySalary: number
): PensionBreakdown {
  const employerContribution = Math.round(monthlySalary * PENSION_EMPLOYER_RATE);
  const employeeContribution = Math.round(monthlySalary * PENSION_EMPLOYEE_RATE);
  const severanceContribution = Math.round(monthlySalary * PENSION_SEVERANCE_RATE);
  const totalMonthlyPension =
    employerContribution + employeeContribution + severanceContribution;

  return {
    employerId,
    employerContribution,
    employeeContribution,
    severanceContribution,
    totalMonthlyPension,
  };
}

export function calculateNIForIncome(annualIncome: number): number {
  if (annualIncome <= 0) return 0;

  if (annualIncome <= NI_REDUCED_RATE_THRESHOLD) {
    return Math.round(annualIncome * NI_REDUCED_RATE);
  }

  const reducedPortion = NI_REDUCED_RATE_THRESHOLD * NI_REDUCED_RATE;
  const fullPortion =
    (annualIncome - NI_REDUCED_RATE_THRESHOLD) * NI_FULL_RATE;
  return Math.round(reducedPortion + fullPortion);
}

export function calculateQuarterlyEstimates(
  totalMonthlySalary: number,
  sessionsEarningsByQuarter: number[]
): QuarterlyNIEstimate[] {
  const currentYear = new Date().getFullYear();

  return [1, 2, 3, 4].map((quarter, i) => {
    const quarterlyFromSalary = totalMonthlySalary * 3;
    const sessionsEarnings = sessionsEarningsByQuarter[i] ?? 0;
    const estimatedEarnings = quarterlyFromSalary + sessionsEarnings;
    const annualizedIncome = estimatedEarnings * 4;
    const annualNI = calculateNIForIncome(annualizedIncome);
    const estimatedNIPayment = Math.round(annualNI / 4);

    return {
      quarter,
      year: currentYear,
      estimatedEarnings,
      estimatedNIPayment,
      sessionsEarnings,
    };
  });
}
