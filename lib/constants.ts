// Israeli labor law constants

/** Convalescence pay per day in ILS (2024 rate) */
export const CONVALESCENCE_PAY_PER_DAY = 418;

/** Convalescence days per year by seniority (years → days) */
export const CONVALESCENCE_DAYS_PER_YEAR: Record<string, number> = {
  "1": 5,
  "2": 6,
  "3": 6,
  "4": 7,
  "5": 7,
  "6": 7,
  "7": 7,
  "8": 7,
  "9": 7,
  "10": 7,
  "11+": 8,
};

/** Sick leave accumulation: days per month */
export const SICK_LEAVE_DAYS_PER_MONTH = 1.5;

/** Maximum accumulable sick days */
export const MAX_SICK_DAYS = 90;

/** Locales that use RTL direction */
export const RTL_LOCALES = ["he", "ar"] as const;
