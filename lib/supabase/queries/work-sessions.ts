import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../database.types";
import { mapWorkSessionRow } from "../mappers";

export async function fetchActiveSessions(client: SupabaseClient<Database>) {
  const { data, error } = await client
    .from("work_sessions")
    .select("*")
    .is("end_time", null);

  if (error) throw error;
  return (data ?? []).map(mapWorkSessionRow);
}

export async function fetchCompletedSessions(
  client: SupabaseClient<Database>
) {
  const { data, error } = await client
    .from("work_sessions")
    .select("*")
    .not("end_time", "is", null)
    .order("end_time", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapWorkSessionRow);
}

export async function insertWorkSession(
  client: SupabaseClient<Database>,
  employerId: string
) {
  const { data, error } = await client
    .from("work_sessions")
    .insert({ employer_id: employerId })
    .select()
    .single();

  if (error) throw error;
  return mapWorkSessionRow(data);
}

export async function endWorkSession(
  client: SupabaseClient<Database>,
  sessionId: string,
  earnings: number
) {
  const { data, error } = await client
    .from("work_sessions")
    .update({
      end_time: new Date().toISOString(),
      earnings,
    })
    .eq("id", sessionId)
    .select()
    .single();

  if (error) throw error;
  return mapWorkSessionRow(data);
}
