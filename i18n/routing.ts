import { defineRouting } from "next-intl/routing";

export const locales = ["he", "ar", "ru", "uk", "am"] as const;
export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: "he",
});
