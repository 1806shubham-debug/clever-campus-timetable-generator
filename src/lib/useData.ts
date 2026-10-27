import { useQueries } from "@tanstack/react-query";
import {
  batchesQuery,
  constraintsQuery,
  facultyQuery,
  roomsQuery,
  subjectsQuery,
  timetablesQuery,
} from "./queries";
import type { Batch, Constraint, Faculty, Room, Subject, Timetable } from "./types";

export function useCoreData() {
  const results = useQueries({
    queries: [
      facultyQuery,
      roomsQuery,
      batchesQuery,
      subjectsQuery,
      constraintsQuery,
      timetablesQuery,
    ],
  });
  const [f, r, b, s, c, t] = results;
  return {
    faculty: (f?.data ?? []) as Faculty[],
    rooms: (r?.data ?? []) as Room[],
    batches: (b?.data ?? []) as Batch[],
    subjects: (s?.data ?? []) as Subject[],
    constraints: (c?.data ?? []) as Constraint[],
    timetables: (t?.data ?? []) as Timetable[],
    isLoading: results.some((x) => x.isLoading),
    error: results.find((x) => x.error)?.error as Error | undefined,
  };
}
