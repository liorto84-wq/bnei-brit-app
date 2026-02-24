import type { EmployerWithBenefits } from "./types";

export function getHourlyRate(employer: EmployerWithBenefits): number {
  const weeksPerMonth = 52 / 12;
  const hoursPerMonth = employer.hoursPerWeek * weeksPerMonth;
  if (hoursPerMonth === 0) return 0;
  return employer.monthlySalary / hoursPerMonth;
}

export function formatElapsedTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
}

let counter = 0;
export function generateId(): string {
  counter += 1;
  return `${Date.now()}-${counter}`;
}
