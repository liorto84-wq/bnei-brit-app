import type { jsPDF } from "jspdf";
import type { EmployerWithBenefits, WorkSession, EmployerDepositStatus } from "@/lib/types";
import { calculatePensionBreakdown } from "@/lib/pension-utils";
import {
  PENSION_EMPLOYER_RATE,
  PENSION_EMPLOYEE_RATE,
  PENSION_SEVERANCE_RATE,
} from "@/lib/constants";
import { loadFonts } from "./font-loader";
import {
  createLayout,
  drawTitle,
  drawSectionTitle,
  drawEmployerHeader,
  drawLabelValue,
  drawStatusRow,
  drawDivider,
  addSpacing,
  finalize,
} from "./pdf-layout";

interface PdfData {
  employers: EmployerWithBenefits[];
  completedSessions: WorkSession[];
  depositStatuses: Map<string, EmployerDepositStatus>;
  getSickDaysUsed: (employerId: string) => number;
}

function flattenMessages(
  obj: Record<string, unknown>,
  prefix = ""
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof val === "string") {
      result[fullKey] = val;
    } else if (typeof val === "object" && val !== null) {
      Object.assign(result, flattenMessages(val as Record<string, unknown>, fullKey));
    }
  }
  return result;
}

function getSessionsForEmployer(sessions: WorkSession[], employerId: string) {
  return sessions.filter(
    (s) => s.employerId === employerId && s.endTime && s.earnings != null
  );
}

function calculateSessionHours(session: WorkSession): number {
  if (!session.endTime) return 0;
  const ms =
    new Date(session.endTime).getTime() - new Date(session.startTime).getTime();
  return ms / (1000 * 60 * 60);
}

function formatCurrency(amount: number): string {
  return `₪${amount.toLocaleString()}`;
}

function formatRate(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

export async function generateMonthlySummary(
  locale: string,
  localeMessages: Record<string, unknown>,
  data: PdfData
) {
  const { jsPDF } = await import("jspdf");
  const doc: jsPDF = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const fonts = await loadFonts(doc, locale);
  const isSingleColumn = locale === "he";

  // Load Hebrew messages if needed
  let hebrewRaw: Record<string, unknown>;
  if (isSingleColumn) {
    hebrewRaw = localeMessages;
  } else {
    const heMod = await import("@/messages/he.json");
    hebrewRaw = heMod.default as Record<string, unknown>;
  }

  const lm = flattenMessages(localeMessages);
  const hm = flattenMessages(hebrewRaw);

  const ctx = createLayout(doc, fonts, isSingleColumn, lm, hm);

  // Title
  const now = new Date();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const monthYear = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
  const dateStr = now.toISOString().split("T")[0];
  const subtitle = `${monthYear} • ${lm["pdf.generatedOn"]} ${dateStr}`;

  drawTitle(ctx, lm["pdf.title"], hm["pdf.title"], subtitle);

  // Per-employer sections
  for (const employer of data.employers) {
    drawEmployerHeader(ctx, lm["pdf.employer"], hm["pdf.employer"], employer.name);

    // --- Work Sessions Summary ---
    const sessions = getSessionsForEmployer(data.completedSessions, employer.id);

    drawSectionTitle(ctx, lm["pdf.workSessionsSummary"], hm["pdf.workSessionsSummary"]);

    if (sessions.length === 0) {
      drawLabelValue(ctx, lm["pdf.noSessions"], hm["pdf.noSessions"], "-");
    } else {
      const totalHours = sessions.reduce((sum, s) => sum + calculateSessionHours(s), 0);
      const totalEarnings = sessions.reduce((sum, s) => sum + (s.earnings ?? 0), 0);

      drawLabelValue(
        ctx,
        lm["pdf.totalHours"],
        hm["pdf.totalHours"],
        totalHours.toFixed(1)
      );
      drawLabelValue(
        ctx,
        lm["pdf.totalEarnings"],
        hm["pdf.totalEarnings"],
        formatCurrency(Math.round(totalEarnings))
      );
      drawLabelValue(
        ctx,
        lm["pdf.sessionsCount"],
        hm["pdf.sessionsCount"],
        String(sessions.length)
      );
    }

    addSpacing(ctx);

    // --- Social Benefits ---
    drawSectionTitle(ctx, lm["pdf.socialBenefits"], hm["pdf.socialBenefits"]);

    drawLabelValue(
      ctx,
      lm["pdf.convalescencePayMonthly"],
      hm["pdf.convalescencePayMonthly"],
      formatCurrency(Math.round(employer.benefits.convalescencePayPerMonth))
    );
    drawLabelValue(
      ctx,
      lm["pdf.convalescenceDaysYearly"],
      hm["pdf.convalescenceDaysYearly"],
      String(employer.benefits.convalescenceDaysPerYear)
    );
    drawLabelValue(
      ctx,
      lm["pdf.yearsOfSeniority"],
      hm["pdf.yearsOfSeniority"],
      employer.benefits.yearsEmployed.toFixed(1)
    );

    addSpacing(ctx);

    // --- Pension & NI ---
    drawSectionTitle(ctx, lm["pdf.pensionAndNI"], hm["pdf.pensionAndNI"]);

    const pension = calculatePensionBreakdown(employer.id, employer.monthlySalary);

    drawLabelValue(
      ctx,
      `${lm["pdf.employerContribution"]} ${formatRate(PENSION_EMPLOYER_RATE)}`,
      `${hm["pdf.employerContribution"]} ${formatRate(PENSION_EMPLOYER_RATE)}`,
      formatCurrency(pension.employerContribution)
    );
    drawLabelValue(
      ctx,
      `${lm["pdf.employeeContribution"]} ${formatRate(PENSION_EMPLOYEE_RATE)}`,
      `${hm["pdf.employeeContribution"]} ${formatRate(PENSION_EMPLOYEE_RATE)}`,
      formatCurrency(pension.employeeContribution)
    );
    drawLabelValue(
      ctx,
      `${lm["pdf.severanceContribution"]} ${formatRate(PENSION_SEVERANCE_RATE)}`,
      `${hm["pdf.severanceContribution"]} ${formatRate(PENSION_SEVERANCE_RATE)}`,
      formatCurrency(pension.severanceContribution)
    );
    drawLabelValue(
      ctx,
      lm["pdf.totalMonthlyPension"],
      hm["pdf.totalMonthlyPension"],
      formatCurrency(pension.totalMonthlyPension)
    );

    // Deposit status
    const deposit = data.depositStatuses.get(employer.id);
    if (deposit) {
      const statusKey = `pdf.${deposit.status}` as const;
      drawStatusRow(
        ctx,
        lm["pdf.depositStatus"],
        hm["pdf.depositStatus"],
        lm[statusKey] ?? deposit.status,
        hm[statusKey] ?? deposit.status
      );

      if (deposit.lastDepositDate) {
        drawLabelValue(
          ctx,
          lm["pdf.lastDeposit"],
          hm["pdf.lastDeposit"],
          deposit.lastDepositDate
        );
      } else {
        drawLabelValue(
          ctx,
          lm["pdf.lastDeposit"],
          hm["pdf.lastDeposit"],
          lm["pdf.noDeposit"]
        );
      }
    }

    addSpacing(ctx);

    // --- Sick Leave ---
    drawSectionTitle(ctx, lm["pdf.sickLeave"], hm["pdf.sickLeave"]);

    const accumulated = employer.benefits.sickLeaveAccumulated;
    const used = data.getSickDaysUsed(employer.id);
    const remaining = accumulated - used;

    drawLabelValue(
      ctx,
      lm["pdf.accumulated"],
      hm["pdf.accumulated"],
      `${accumulated} (1.5/${lm["common.perMonth"]})`
    );
    drawLabelValue(ctx, lm["pdf.used"], hm["pdf.used"], String(used));
    drawLabelValue(ctx, lm["pdf.remaining"], hm["pdf.remaining"], String(remaining));

    addSpacing(ctx, 5);
    drawDivider(ctx);
  }

  finalize(ctx);

  const fileName = `monthly-summary-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}.pdf`;
  doc.save(fileName);
}
