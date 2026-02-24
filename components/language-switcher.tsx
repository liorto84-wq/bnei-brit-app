"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

const localeLabels: Record<Locale, string> = {
  he: "עברית",
  ar: "عربية",
  ru: "Русский",
  uk: "Українська",
  am: "አማርኛ",
};

export default function LanguageSwitcher() {
  const t = useTranslations("language");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    router.replace(pathname, { locale: e.target.value as Locale });
  }

  return (
    <select
      value={locale}
      onChange={onChange}
      aria-label={t("switchLanguage")}
      className="rounded-lg border border-teal-200 bg-white px-3 py-2 text-sm text-teal-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
    >
      {Object.entries(localeLabels).map(([code, label]) => (
        <option key={code} value={code}>
          {label}
        </option>
      ))}
    </select>
  );
}
