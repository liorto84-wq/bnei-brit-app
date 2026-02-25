import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../database.types";
import type { ContractConfig } from "@/lib/types";
import { mapContractConfigRow, contractConfigToRow } from "../mappers";

export async function fetchAllContractConfigs(
  client: SupabaseClient<Database>
) {
  const { data, error } = await client.from("contract_configs").select("*");

  if (error) throw error;
  return (data ?? []).map(mapContractConfigRow);
}

export async function upsertContractConfig(
  client: SupabaseClient<Database>,
  config: ContractConfig
) {
  const row = contractConfigToRow(config);
  const { data, error } = await client
    .from("contract_configs")
    .upsert(row, { onConflict: "employer_id" })
    .select()
    .single();

  if (error) throw error;
  return mapContractConfigRow(data);
}
