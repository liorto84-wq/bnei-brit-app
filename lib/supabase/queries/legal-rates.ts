import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../database.types";

export interface LegalRatesMap {
  convalescence_pay_per_day: number;
  sick_leave_days_per_month: number;
  max_sick_days: number;
  pension_employer_rate: number;
  pension_employee_rate: number;
  pension_severance_rate: number;
  ni_reduced_rate_threshold: number;
  ni_full_rate: number;
  ni_reduced_rate: number;
}

export interface ConvalescenceTier {
  minYears: number;
  maxYears: number | null;
  daysPerYear: number;
}

export async function fetchActiveLegalRates(
  client: SupabaseClient<Database>
): Promise<LegalRatesMap> {
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await client
    .from("legal_rates")
    .select("rate_key, rate_value")
    .lte("effective_from", today)
    .or(`effective_to.is.null,effective_to.gte.${today}`);

  if (error) throw error;

  const rates: Record<string, number> = {};
  for (const row of data ?? []) {
    rates[row.rate_key] = Number(row.rate_value);
  }

  return rates as unknown as LegalRatesMap;
}

export async function fetchConvalescenceSchedule(
  client: SupabaseClient<Database>
): Promise<ConvalescenceTier[]> {
  const { data, error } = await client
    .from("convalescence_days_schedule")
    .select("min_years, max_years, days_per_year")
    .order("min_years", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    minYears: row.min_years,
    maxYears: row.max_years,
    daysPerYear: row.days_per_year,
  }));
}
