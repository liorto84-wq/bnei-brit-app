"use client";

import { useTranslations } from "next-intl";
import { useEmployers } from "@/contexts/employer-context";
import { Link } from "@/i18n/navigation";
import EmployerCard from "@/components/employer-card";
import HolidayAlertModal from "@/components/holiday-alert-modal";
import ComplianceSection from "@/components/compliance-section";
import GeneratePdfButton from "@/components/generate-pdf-button";

function LoadingSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 animate-pulse">
      {/* Title skeleton */}
      <div className="mb-8">
        <div className="h-8 w-48 bg-teal-100 rounded" />
        <div className="mt-2 h-5 w-64 bg-teal-50 rounded" />
      </div>

      {/* Balance card skeleton */}
      <div className="mb-8 rounded-2xl bg-teal-200 p-6 h-32" />

      {/* Employer cards skeleton */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 rounded-xl bg-gray-100" />
        ))}
      </div>
    </div>
  );
}

export default function DashboardContent() {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const tAdd = useTranslations("addEmployer");
  const { employers, totalBalance, isLoading, error } = useEmployers();

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-center">
          <p className="text-red-700 font-medium">
            {error}
          </p>
        </div>
      </div>
    );
  }

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

      {/* FAB — Add Employer */}
      <Link
        href="/add-employer"
        className="fixed bottom-20 end-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-teal-600 text-white shadow-lg transition-transform hover:scale-110 hover:bg-teal-700 active:scale-95"
        aria-label={tAdd("addEmployerFab")}
      >
        <svg
          className="h-7 w-7"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4.5v15m7.5-7.5h-15"
          />
        </svg>
      </Link>
    </div>
  );
}
