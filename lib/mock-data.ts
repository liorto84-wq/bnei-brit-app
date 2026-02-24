import {
  CONVALESCENCE_PAY_PER_DAY,
  CONVALESCENCE_DAYS_PER_YEAR,
  SICK_LEAVE_DAYS_PER_MONTH,
  MAX_SICK_DAYS,
} from "./constants";
import type { Employer, EmployerWithBenefits, SocialBenefits } from "./types";

function getConvalescenceDays(yearsEmployed: number): number {
  if (yearsEmployed < 1) return 0;
  if (yearsEmployed >= 11) return CONVALESCENCE_DAYS_PER_YEAR["11+"];
  return CONVALESCENCE_DAYS_PER_YEAR[String(Math.floor(yearsEmployed))] ?? 5;
}

export function calculateBenefits(employer: Employer): SocialBenefits {
  const now = new Date();
  const start = new Date(employer.startDate);
  const msEmployed = now.getTime() - start.getTime();
  const yearsEmployed = msEmployed / (365.25 * 24 * 60 * 60 * 1000);
  const monthsEmployed = msEmployed / (30.44 * 24 * 60 * 60 * 1000);

  const convalescenceDaysPerYear = getConvalescenceDays(yearsEmployed);
  const convalescencePayPerMonth =
    (convalescenceDaysPerYear * CONVALESCENCE_PAY_PER_DAY) / 12;

  const sickLeaveAccumulated = Math.min(
    Math.floor(monthsEmployed * SICK_LEAVE_DAYS_PER_MONTH * 10) / 10,
    MAX_SICK_DAYS
  );

  return {
    convalescencePayPerMonth: Math.round(convalescencePayPerMonth),
    convalescenceDaysPerYear,
    sickLeaveAccumulated,
    yearsEmployed: Math.round(yearsEmployed * 10) / 10,
  };
}

export function createEmployerWithBenefits(
  employer: Employer
): EmployerWithBenefits {
  const benefits = calculateBenefits(employer);
  return {
    ...employer,
    benefits,
    totalMonthly: employer.monthlySalary + benefits.convalescencePayPerMonth,
  };
}

const mockEmployers: Employer[] = [
  {
    id: "1",
    name: "משפחת כהן",
    monthlySalary: 3500,
    hoursPerWeek: 12,
    startDate: "2022-03-15",
  },
  {
    id: "2",
    name: "משפחת לוי",
    monthlySalary: 2800,
    hoursPerWeek: 8,
    startDate: "2023-09-01",
  },
  {
    id: "3",
    name: "משפחת מזרחי",
    monthlySalary: 4200,
    hoursPerWeek: 16,
    startDate: "2021-01-10",
  },
];

export const mockEmployersWithBenefits: EmployerWithBenefits[] =
  mockEmployers.map(createEmployerWithBenefits);
