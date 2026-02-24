"use client";

import { useTranslations } from "next-intl";
import { useEmployers } from "@/contexts/employer-context";
import EmployerCard from "@/components/employer-card";
import HolidayAlertModal from "@/components/holiday-alert-modal";
import ComplianceSection from "@/components/compliance-section";
import GeneratePdfButton from "@/components/generate-pdf-button";

export default function DashboardContent() {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const { employers, totalBalance } = useEmployers();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <HolidayAlertModal />
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-teal-900">{t("title")}</h2>
        <p className="text-teal-600">{t("subtitle")}</p>
      </div>

      {/* Total Balance Card */}
      <div className="mb-8 rounded-2xl bg-gradient-to-r from-teal-600 to-teal-700 p-6 text-white shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-teal-100">
              {t("totalBalance")}
            </p>
            <p className="mt-1 text-4xl font-bold">
              {tc("currency")}
              {totalBalance.toLocaleString()}
            </p>
            <p className="mt-2 text-sm text-teal-200">
              {employers.length} {t("totalEmployers")}
            </p>
          </div>
          <GeneratePdfButton />
        </div>
      </div>

      {/* Employer Cards Grid */}
      {employers.length === 0 ? (
        <p className="text-center text-gray-500">{t("noEmployers")}</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {employers.map((employer) => (
            <EmployerCard key={employer.id} employer={employer} />
          ))}
        </div>
      )}

      {/* Compliance & Pension Hub */}
      <ComplianceSection />
    </div>
  );
}
