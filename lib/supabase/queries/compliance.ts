import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../database.types";
import { mapComplianceDepositRow } from "../mappers";

export async function fetchDepositStatuses(
  client: SupabaseClient<Database>
) {
  const { data, error } = await client
    .from("compliance_deposits")
    .select("*");

  if (error) throw error;
  return (data ?? []).map(mapComplianceDepositRow);
}

export async function markAsDeposited(
  client: SupabaseClient<Database>,
  employerId: string
) {
  const { data, error } = await client
    .from("compliance_deposits")
    .upsert(
      {
        employer_id: employerId,
        status: "compliant" as const,
        last_deposit_date: new Date().toISOString().split("T")[0],
      },
      { onConflict: "employer_id" }
    )
    .select()
    .single();

  if (error) throw error;
  return mapComplianceDepositRow(data);
}
