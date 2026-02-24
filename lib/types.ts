export interface Employer {
  id: string;
  name: string;
  monthlySalary: number;
  hoursPerWeek: number;
  startDate: string; // ISO date string
}

export interface SocialBenefits {
  convalescencePayPerMonth: number;
  convalescenceDaysPerYear: number;
  sickLeaveAccumulated: number;
  yearsEmployed: number;
}

export interface EmployerWithBenefits extends Employer {
  benefits: SocialBenefits;
  totalMonthly: number;
}

export type AbsenceType = "sick_leave" | "personal" | "vacation";

export interface AbsenceRecord {
  id: string;
  employerId: string;
  type: AbsenceType;
  date: string;
  createdAt: string;
  medicalCertificateFileName?: string;
}

export interface WorkSession {
  id: string;
  employerId: string;
  startTime: string;
  endTime?: string;
  earnings?: number;
}

export type HolidayDecision = "cancel" | "reschedule";

export interface HolidayDecisionRecord {
  employerId: string;
  holidayDate: string;
  holidayKey: string;
  decision: HolidayDecision;
}

export interface Holiday {
  key: string;
  date: string;
}
