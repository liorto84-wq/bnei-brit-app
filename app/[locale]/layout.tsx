import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { RTL_LOCALES } from "@/lib/constants";
import { EmployerProvider } from "@/contexts/employer-context";
import { VisitReportingProvider } from "@/contexts/visit-reporting-context";
import { ComplianceProvider } from "@/contexts/compliance-context";
import Header from "@/components/header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bnei Brit - My Jobs",
  description: "Domestic worker-employer management platform",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as typeof routing.locales[number])) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();
  const dir = (RTL_LOCALES as readonly string[]).includes(locale)
    ? "rtl"
    : "ltr";

  return (
    <html lang={locale} dir={dir}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <EmployerProvider>
            <VisitReportingProvider>
              <ComplianceProvider>
                <Header />
                <main>{children}</main>
              </ComplianceProvider>
            </VisitReportingProvider>
          </EmployerProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
