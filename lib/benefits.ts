import {
  CONVALESCENCE_PAY_PER_DAY,
  CONVALESCENCE_DAYS_PER_YEAR,
  SICK_LEAVE_DAYS_PER_MONTH,
  MAX_SICK_DAYS,
} from "./constants";
import type { Employer, EmployerWithBenefits, SocialBenefits } from "./types";
import type { ConvalescenceTier } from "./supabase/queries/legal-rates";

// --- Parameterized version (uses DB rates when available) ---

export interface BenefitRates {
  convalescencePayPerDay: number;
  sickLeaveDaysPerMonth: number;
  maxSickDays: number;
  convalescenceSchedule: ConvalescenceTier[];
}

/** Fallback rates from constants.ts */
export const DEFAULT_BENEFIT_RATES: BenefitRates = {
  convalescencePayPerDay: CONVALESCENCE_PAY_PER_DAY,
  sickLeaveDaysPerMonth: SICK_LEAVE_DAYS_PER_MONTH,
  maxSickDays: MAX_SICK_DAYS,
  convalescenceSchedule: [
    { minYears: 1, maxYears: 1, daysPerYear: 5 },
    { minYears: 2, maxYears: 3, daysPerYear: 6 },
    { minYears: 4, maxYears: 10, daysPerYear: 7 },
    { minYears: 11, maxYears: null, daysPerYear: 8 },
  ],
};

function getConvalescenceDaysFromSchedule(
  yearsEmployed: number,
  schedule: ConvalescenceTier[]
): number {
  if (yearsEmployed < 1) return 0;
  const years = Math.floor(yearsEmployed);
  for (const tier of schedule) {
    if (years >= tier.minYears && (tier.maxYears === null || years <= tier.maxYears)) {
      return tier.daysPerYear;
    }
  }
  return 5; // fallback
}

function getConvalescenceDaysLegacy(yearsEmployed: number): number {
  if (yearsEmployed < 1) return 0;
  if (yearsEmployed >= 11) return CONVALESCENCE_DAYS_PER_YEAR["11+"];
  return CONVALESCENCE_DAYS_PER_YEAR[String(Math.floor(yearsEmployed))] ?? 5;
}

export function calculateBenefits(
  employer: Employer,
  rates?: BenefitRates
): SocialBenefits {
  const now = new Date();
  const start = new Date(employer.startDate);
  const msEmployed = now.getTime() - start.getTime();
  const yearsEmployed = msEmployed / (365.25 * 24 * 60 * 60 * 1000);
  const monthsEmployed = msEmployed / (30.44 * 24 * 60 * 60 * 1000);

  const payPerDay = rates?.convalescencePayPerDay ?? CONVALESCENCE_PAY_PER_DAY;
  const sickPerMonth = rates?.sickLeaveDaysPerMonth ?? SICK_LEAVE_DAYS_PER_MONTH;
  const maxSick = rates?.maxSickDays ?? MAX_SICK_DAYS;

  const convalescenceDaysPerYear = rates?.convalescenceSchedule
    ? getConvalescenceDaysFromSchedule(yearsEmployed, rates.convalescenceSchedule)
    : getConvalescenceDaysLegacy(yearsEmployed);

  const convalescencePayPerMonth =
    (convalescenceDaysPerYear * payPerDay) / 12;

  const sickLeaveAccumulated = Math.min(
    Math.floor(monthsEmployed * sickPerMonth * 10) / 10,
    maxSick
  );

  return {
    convalescencePayPerMonth: Math.round(convalescencePayPerMonth),
    convalescenceDaysPerYear,
    sickLeaveAccumulated,
    yearsEmployed: Math.round(yearsEmployed * 10) / 10,
  };
}

export function createEmployerWithBenefits(
  employer: Employer,
  rates?: BenefitRates
): EmployerWithBenefits {
  const benefits = calculateBenefits(employer, rates);
  return {
    ...employer,
    benefits,
    totalMonthly: employer.monthlySalary + benefits.convalescencePayPerMonth,
  };
}
