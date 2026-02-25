import { setRequestLocale } from "next-intl/server";
import FinancialOverviewContent from "./financial-overview-content";

export default async function FinancialOverviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <FinancialOverviewContent />;
}
