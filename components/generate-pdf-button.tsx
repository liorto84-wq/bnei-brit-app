"use client";

import { useState } from "react";
import { useLocale, useMessages, useTranslations } from "next-intl";
import { useEmployers } from "@/contexts/employer-context";
import { useVisitReporting } from "@/contexts/visit-reporting-context";
import { useCompliance } from "@/contexts/compliance-context";

export default function GeneratePdfButton() {
  const [generating, setGenerating] = useState(false);
  const t = useTranslations("pdf");
  const locale = useLocale();
  const messages = useMessages();
  const { employers } = useEmployers();
  const { completedSessions, getSickDaysUsed } = useVisitReporting();
  const { depositStatuses } = useCompliance();

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { generateMonthlySummary } = await import(
        "@/lib/pdf/generate-monthly-summary"
      );

      await generateMonthlySummary(locale, messages as Record<string, unknown>, {
        employers,
        completedSessions,
        depositStatuses,
        getSickDaysUsed,
      });
    } catch (error) {
      console.error("PDF generation failed:", error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <button
      onClick={handleGenerate}
      disabled={generating}
      className="rounded-lg bg-white/20 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/30 disabled:opacity-60"
    >
      {generating ? t("generating") : t("generatePdf")}
    </button>
  );
}
