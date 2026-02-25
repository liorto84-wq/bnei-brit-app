import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, HolidayDecisionEnum } from "../database.types";
import { mapHolidayDecisionRow } from "../mappers";

export async function fetchHolidayDecisions(
  client: SupabaseClient<Database>
) {
  const { data, error } = await client
    .from("holiday_decisions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapHolidayDecisionRow);
}

export async function insertHolidayDecision(
  client: SupabaseClient<Database>,
  employerId: string,
  holidayKey: string,
  holidayDate: string,
  decision: HolidayDecisionEnum
) {
  const { data, error } = await client
    .from("holiday_decisions")
    .upsert(
      {
        employer_id: employerId,
        holiday_key: holidayKey,
        holiday_date: holidayDate,
        decision,
      },
      { onConflict: "employer_id,holiday_key" }
    )
    .select()
    .single();

  if (error) throw error;
  return mapHolidayDecisionRow(data);
}

export async function fetchDismissedHolidays(
  client: SupabaseClient<Database>
) {
  const { data, error } = await client
    .from("dismissed_holidays")
    .select("holiday_key");

  if (error) throw error;
  return new Set((data ?? []).map((row) => row.holiday_key));
}

export async function dismissHoliday(
  client: SupabaseClient<Database>,
  holidayKey: string
) {
  const { error } = await client
    .from("dismissed_holidays")
    .upsert(
      { holiday_key: holidayKey },
      { onConflict: "user_id,holiday_key" }
    );

  if (error) throw error;
}
