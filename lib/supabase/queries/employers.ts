import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../database.types";
import { mapEmployerRow } from "../mappers";

export async function fetchEmployers(client: SupabaseClient<Database>) {
  const { data, error } = await client
    .from("employers")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapEmployerRow);
}

export async function fetchEmployerById(
  client: SupabaseClient<Database>,
  id: string
) {
  const { data, error } = await client
    .from("employers")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return mapEmployerRow(data);
}

export async function insertEmployer(
  client: SupabaseClient<Database>,
  input: {
    name: string;
    monthlySalary: number;
    hoursPerWeek: number;
    startDate: string;
  }
) {
  const { data, error } = await client
    .from("employers")
    .insert({
      name: input.name,
      monthly_salary: input.monthlySalary,
      hours_per_week: input.hoursPerWeek,
      start_date: input.startDate,
    })
    .select()
    .single();

  if (error) throw error;
  return mapEmployerRow(data);
}

export async function updateEmployer(
  client: SupabaseClient<Database>,
  id: string,
  input: {
    name?: string;
    monthlySalary?: number;
    hoursPerWeek?: number;
    startDate?: string;
  }
) {
  const updates: Database["public"]["Tables"]["employers"]["Update"] = {};
  if (input.name !== undefined) updates.name = input.name;
  if (input.monthlySalary !== undefined) updates.monthly_salary = input.monthlySalary;
  if (input.hoursPerWeek !== undefined) updates.hours_per_week = input.hoursPerWeek;
  if (input.startDate !== undefined) updates.start_date = input.startDate;

  const { data, error } = await client
    .from("employers")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return mapEmployerRow(data);
}
