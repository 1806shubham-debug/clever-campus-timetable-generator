export type Faculty = {
  id: string;
  name: string;
  code: string;
  department: string;
  designation: string;
  email: string | null;
  max_hours_per_week: number;
  unavailable_slots: string[];
  created_at: string;
};

export type Room = {
  id: string;
  name: string;
  code: string;
  capacity: number;
  room_type: string;
  building: string;
  created_at: string;
};

export type Batch = {
  id: string;
  name: string;
  code: string;
  department: string;
  semester: number;
  strength: number;
  created_at: string;
};

export type Subject = {
  id: string;
  name: string;
  code: string;
  credits: number;
  hours_per_week: number;
  subject_type: string;
  faculty_id: string | null;
  batch_id: string | null;
  requires_lab: boolean;
  created_at: string;
};

export type Constraint = {
  id: string;
  name: string;
  code: string;
  constraint_type: string;
  weight: number;
  enabled: boolean;
  description: string | null;
  created_at: string;
};

export type Assignment = {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  subjectType: string;
  batchId: string;
  batchCode: string;
  facultyId: string | null;
  facultyCode: string;
  facultyName: string;
  roomId: string;
  roomCode: string;
  day: number;
  period: number;
};

export type RunMetrics = {
  hardBreakdown: Record<string, number>;
  softBreakdown: Record<string, number>;
  convergence: { iteration: number; fitness: number }[];
  facultyLoad: { code: string; name: string; hours: number; max: number }[];
  roomUsage: { code: string; used: number; capacity: number }[];
  dayLoad: { day: string; classes: number }[];
};

export type Timetable = {
  id: string;
  name: string;
  algorithm: string;
  fitness: number;
  hard_conflicts: number;
  soft_penalties: number;
  execution_ms: number;
  iterations: number;
  scheduled_count: number;
  required_count: number;
  utilization: number;
  entries: Assignment[];
  metrics: RunMetrics;
  created_at: string;
};

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
export const DAY_SHORT = ["MON", "TUE", "WED", "THU", "FRI"];
export const PERIODS = [
  "09:00-09:55",
  "10:00-10:55",
  "11:10-12:05",
  "12:10-13:05",
  "14:00-14:55",
  "15:00-15:55",
  "16:05-17:00",
];
