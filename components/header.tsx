"use client";

import { useTranslations } from "next-intl";
import LanguageSwitcher from "./language-switcher";

export default function Header() {
  const t = useTranslations("nav");

  return (
    <header className="border-b border-teal-100 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-lg font-bold text-white">
            BB
          </div>
          <div>
            <h1 className="text-lg font-bold text-teal-900">{t("appName")}</h1>
            <p className="text-xs text-teal-600">{t("myJobs")}</p>
          </div>
        </div>
        <LanguageSwitcher />
      </div>
    </header>
  );
}
