import type { Database } from "./database.types";
import type {
  Employer,
  ContractConfig,
  WorkSession,
  AbsenceRecord,
  HolidayDecisionRecord,
  EmployerDepositStatus,
  RewardType,
  AbsenceType,
  HolidayDecision,
  DepositStatus,
} from "@/lib/types";

type EmployerRow = Database["public"]["Tables"]["employers"]["Row"];
type ContractConfigRow = Database["public"]["Tables"]["contract_configs"]["Row"];
type WorkSessionRow = Database["public"]["Tables"]["work_sessions"]["Row"];
type AbsenceRow = Database["public"]["Tables"]["absences"]["Row"];
type HolidayDecisionRow = Database["public"]["Tables"]["holiday_decisions"]["Row"];
type ComplianceDepositRow = Database["public"]["Tables"]["compliance_deposits"]["Row"];

// --- Employer ---

export function mapEmployerRow(row: EmployerRow): Employer {
  return {
    id: row.id,
    name: row.name,
    monthlySalary: Number(row.monthly_salary),
    hoursPerWeek: Number(row.hours_per_week),
    startDate: row.start_date,
  };
}

// --- Contract Config ---

export function mapContractConfigRow(row: ContractConfigRow): ContractConfig {
  return {
    employerId: row.employer_id,
    rewardType: row.reward_type as RewardType,
    cancellationPolicy: {
      noticeHours: row.notice_hours,
      shortNoticePayPercent: row.short_notice_pay_percent,
    },
    dailyRate: row.daily_rate != null ? Number(row.daily_rate) : undefined,
    globalMonthlyAmount:
      row.global_monthly_amount != null
        ? Number(row.global_monthly_amount)
        : undefined,
    notes: row.notes ?? undefined,
  };
}

export function contractConfigToRow(config: ContractConfig) {
  return {
    employer_id: config.employerId,
    reward_type: config.rewardType,
    notice_hours: config.cancellationPolicy.noticeHours,
    short_notice_pay_percent: config.cancellationPolicy.shortNoticePayPercent,
    daily_rate: config.dailyRate ?? null,
    global_monthly_amount: config.globalMonthlyAmount ?? null,
    notes: config.notes ?? null,
  };
}

// --- Work Session ---

export function mapWorkSessionRow(row: WorkSessionRow): WorkSession {
  return {
    id: row.id,
    employerId: row.employer_id,
    startTime: row.start_time,
    endTime: row.end_time ?? undefined,
    earnings: row.earnings != null ? Number(row.earnings) : undefined,
  };
}

// --- Absence ---

export function mapAbsenceRow(row: AbsenceRow): AbsenceRecord {
  return {
    id: row.id,
    employerId: row.employer_id,
    type: row.absence_type as AbsenceType,
    date: row.absence_date,
    createdAt: row.created_at,
    medicalCertificateFileName:
      row.medical_certificate_file_name ?? undefined,
  };
}

// --- Holiday Decision ---

export function mapHolidayDecisionRow(
  row: HolidayDecisionRow
): HolidayDecisionRecord {
  return {
    employerId: row.employer_id,
    holidayDate: row.holiday_date,
    holidayKey: row.holiday_key,
    decision: row.decision as HolidayDecision,
  };
}

// --- Compliance Deposit ---

export function mapComplianceDepositRow(
  row: ComplianceDepositRow
): EmployerDepositStatus {
  return {
    employerId: row.employer_id,
    status: row.status as DepositStatus,
    lastDepositDate: row.last_deposit_date,
  };
}
