import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, AbsenceTypeEnum } from "../database.types";
import { mapAbsenceRow } from "../mappers";

export async function fetchAbsences(client: SupabaseClient<Database>) {
  const { data, error } = await client
    .from("absences")
    .select("*")
    .order("absence_date", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapAbsenceRow);
}

export async function insertAbsence(
  client: SupabaseClient<Database>,
  employerId: string,
  absenceType: AbsenceTypeEnum,
  absenceDate: string,
  medicalCertificateFileName?: string
) {
  const { data, error } = await client
    .from("absences")
    .insert({
      employer_id: employerId,
      absence_type: absenceType,
      absence_date: absenceDate,
      medical_certificate_file_name: medicalCertificateFileName ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return mapAbsenceRow(data);
}

export async function countSickDays(
  client: SupabaseClient<Database>,
  employerId: string
) {
  const { count, error } = await client
    .from("absences")
    .select("*", { count: "exact", head: true })
    .eq("employer_id", employerId)
    .eq("absence_type", "sick_leave");

  if (error) throw error;
  return count ?? 0;
}
