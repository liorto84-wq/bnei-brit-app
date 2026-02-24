import type { Holiday } from "./types";

export const HOLIDAYS: Holiday[] = [
  { key: "rosh_hashana", date: "2025-09-23" },
  { key: "rosh_hashana_2", date: "2025-09-24" },
  { key: "yom_kippur", date: "2025-10-02" },
  { key: "sukkot", date: "2025-10-07" },
  { key: "simchat_torah", date: "2025-10-14" },
  { key: "hanukkah", date: "2025-12-15" },
  { key: "purim", date: "2026-03-06" },
  { key: "pesach_start", date: "2026-04-02" },
  { key: "pesach_end", date: "2026-04-08" },
  { key: "yom_haatzmaut", date: "2026-04-22" },
  { key: "shavuot", date: "2026-05-22" },
];

export function getUpcomingHolidays(withinDays = 7): Holiday[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() + withinDays);

  return HOLIDAYS.filter((h) => {
    const d = new Date(h.date + "T00:00:00");
    return d >= now && d <= cutoff;
  });
}
