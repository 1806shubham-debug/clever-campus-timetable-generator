import { queryOptions } from "@tanstack/react-query";
import { supabase as typedSupabase } from "@/integrations/supabase/client";
import type { Batch, Constraint, Faculty, Room, Subject, Timetable } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */
const supabase = typedSupabase as any;

async function list<T>(table: string, order = "created_at"): Promise<T[]> {
  const { data, error } = await supabase.from(table).select("*").order(order, { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as T[];
}

export const facultyQuery = queryOptions({
  queryKey: ["faculty"],
  queryFn: () => list<Faculty>("faculty", "code"),
});
export const roomsQuery = queryOptions({
  queryKey: ["rooms"],
  queryFn: () => list<Room>("rooms", "code"),
});
export const batchesQuery = queryOptions({
  queryKey: ["batches"],
  queryFn: () => list<Batch>("batches", "code"),
});
export const subjectsQuery = queryOptions({
  queryKey: ["subjects"],
  queryFn: () => list<Subject>("subjects", "code"),
});
export const constraintsQuery = queryOptions({
  queryKey: ["constraints"],
  queryFn: () => list<Constraint>("constraints", "constraint_type"),
});
export const timetablesQuery = queryOptions({
  queryKey: ["timetables"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("timetables")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as Timetable[];
  },
});

export function timetableQuery(id: string) {
  return queryOptions({
    queryKey: ["timetable", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("timetables").select("*").eq("id", id).maybeSingle();
      if (error) throw new Error(error.message);
      return (data ?? null) as unknown as Timetable | null;
    },
  });
}

export async function upsertRow(table: string, row: Record<string, unknown>) {
  const { error } = await supabase.from(table).upsert(row);
  if (error) throw new Error(error.message);
}

export async function insertRow(table: string, row: Record<string, unknown>) {
  const { data, error } = await supabase.from(table).insert(row).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateRow(table: string, id: string, row: Record<string, unknown>) {
  const { error } = await supabase.from(table).update(row).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteRow(table: string, id: string) {
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw new Error(error.message);
}
