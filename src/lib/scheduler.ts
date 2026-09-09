import type { Assignment, Batch, Constraint, Faculty, Room, RunMetrics, Subject } from "./types";
import { DAY_SHORT } from "./types";

export const DAY_COUNT = 5;
export const PERIOD_COUNT = 7;
export const SLOT_COUNT = DAY_COUNT * PERIOD_COUNT;

export type AlgorithmKey = "greedy" | "backtracking" | "genetic";

export const ALGORITHMS: { key: AlgorithmKey; label: string; blurb: string; color: string }[] = [
  {
    key: "greedy",
    label: "Greedy Heuristic",
    blurb: "Most-constrained-first placement, single pass, no revision.",
    color: "var(--sun)",
  },
  {
    key: "backtracking",
    label: "Backtracking / CSP",
    blurb: "Depth-first search with MRV ordering and forward pruning.",
    color: "var(--cobalt)",
  },
  {
    key: "genetic",
    label: "Genetic Algorithm",
    blurb: "Population search with tournament selection, crossover, mutation.",
    color: "var(--orchid)",
  },
];

export type SchedulerInput = {
  faculty: Faculty[];
  rooms: Room[];
  batches: Batch[];
  subjects: Subject[];
  constraints: Constraint[];
};

export type Lesson = {
  id: string;
  subject: Subject;
  batch: Batch;
  faculty: Faculty | null;
};

export type SolveResult = {
  algorithm: AlgorithmKey;
  assignments: Assignment[];
  fitness: number;
  hardConflicts: number;
  softPenalties: number;
  executionMs: number;
  iterations: number;
  scheduled: number;
  required: number;
  utilization: number;
  metrics: RunMetrics;
};

type Slotted = { lesson: Lesson; slot: number; room: Room };

function weightOf(constraints: Constraint[], code: string, fallback: number) {
  const c = constraints.find((x) => x.code === code);
  if (!c || !c.enabled) return 0;
  return c.weight || fallback;
}

export function buildLessons(input: SchedulerInput): Lesson[] {
  const lessons: Lesson[] = [];
  for (const subject of input.subjects) {
    const batch = input.batches.find((b) => b.id === subject.batch_id);
    if (!batch) continue;
    const faculty = input.faculty.find((f) => f.id === subject.faculty_id) ?? null;
    for (let i = 0; i < Math.max(1, subject.hours_per_week); i++) {
      lessons.push({ id: `${subject.id}#${i}`, subject, batch, faculty });
    }
  }
  return lessons;
}

function facultyBlocked(faculty: Faculty | null, slot: number) {
  if (!faculty) return false;
  const day = Math.floor(slot / PERIOD_COUNT);
  const period = slot % PERIOD_COUNT;
  const list = Array.isArray(faculty.unavailable_slots) ? faculty.unavailable_slots : [];
  return list.includes(`${day}-${period}`);
}

function roomOk(lesson: Lesson, room: Room, constraints: SchedulerInput["constraints"]) {
  const labRule = weightOf(constraints, "C_LAB_ROOM", 80) > 0;
  const capRule = weightOf(constraints, "C_CAPACITY", 80) > 0;
  const isLab = lesson.subject.requires_lab || lesson.subject.subject_type === "Lab";
  if (labRule) {
    if (isLab && room.room_type !== "Lab") return false;
    if (!isLab && room.room_type === "Lab") return false;
  }
  if (capRule && room.capacity < lesson.batch.strength) return false;
  return true;
}

function toAssignment(s: Slotted): Assignment {
  return {
    subjectId: s.lesson.subject.id,
    subjectCode: s.lesson.subject.code,
    subjectName: s.lesson.subject.name,
    subjectType: s.lesson.subject.subject_type,
    batchId: s.lesson.batch.id,
    batchCode: s.lesson.batch.code,
    facultyId: s.lesson.faculty?.id ?? null,
    facultyCode: s.lesson.faculty?.code ?? "—",
    facultyName: s.lesson.faculty?.name ?? "Unassigned",
    roomId: s.room.id,
    roomCode: s.room.code,
    day: Math.floor(s.slot / PERIOD_COUNT),
    period: s.slot % PERIOD_COUNT,
  };
}

export function evaluate(
  placed: Slotted[],
  input: SchedulerInput,
  requiredCount: number,
  convergence: { iteration: number; fitness: number }[] = [],
): Omit<SolveResult, "algorithm" | "executionMs" | "iterations"> {
  const c = input.constraints;
  const hardBreakdown: Record<string, number> = {
    "Faculty clash": 0,
    "Room clash": 0,
    "Batch clash": 0,
    "Room type / capacity": 0,
    "Faculty unavailable": 0,
    Unscheduled: Math.max(0, requiredCount - placed.length),
  };

  const facSeen = new Map<string, number>();
  const roomSeen = new Map<string, number>();
  const batchSeen = new Map<string, number>();

  for (const p of placed) {
    if (p.lesson.faculty) {
      const k = `${p.lesson.faculty.id}:${p.slot}`;
      const n = (facSeen.get(k) ?? 0) + 1;
      facSeen.set(k, n);
      if (n > 1) hardBreakdown["Faculty clash"]! += 1;
      if (facultyBlocked(p.lesson.faculty, p.slot)) hardBreakdown["Faculty unavailable"]! += 1;
    }
    const rk = `${p.room.id}:${p.slot}`;
    const rn = (roomSeen.get(rk) ?? 0) + 1;
    roomSeen.set(rk, rn);
    if (rn > 1) hardBreakdown["Room clash"]! += 1;

    const bk = `${p.lesson.batch.id}:${p.slot}`;
    const bn = (batchSeen.get(bk) ?? 0) + 1;
    batchSeen.set(bk, bn);
    if (bn > 1) hardBreakdown["Batch clash"]! += 1;

    if (!roomOk(p.lesson, p.room, c)) hardBreakdown["Room type / capacity"]! += 1;
  }

  // Soft constraints
  const wLoad = weightOf(c, "C_FAC_LOAD", 25);
  const wGaps = weightOf(c, "C_GAPS", 15);
  const wSpread = weightOf(c, "C_SPREAD", 12);
  const wMorning = weightOf(c, "C_MORNING", 8);

  const softBreakdown: Record<string, number> = {
    "Faculty overload": 0,
    "Batch idle gaps": 0,
    "Subject repeated in day": 0,
    "Late theory slots": 0,
  };

  const loadByFaculty = new Map<string, number>();
  for (const p of placed) {
    if (!p.lesson.faculty) continue;
    loadByFaculty.set(p.lesson.faculty.id, (loadByFaculty.get(p.lesson.faculty.id) ?? 0) + 1);
  }
  for (const f of input.faculty) {
    const load = loadByFaculty.get(f.id) ?? 0;
    if (load > f.max_hours_per_week) {
      softBreakdown["Faculty overload"]! += (load - f.max_hours_per_week) * wLoad;
    }
  }

  const byBatchDay = new Map<string, number[]>();
  const subjectDay = new Map<string, number>();
  for (const p of placed) {
    const day = Math.floor(p.slot / PERIOD_COUNT);
    const period = p.slot % PERIOD_COUNT;
    const key = `${p.lesson.batch.id}:${day}`;
    const arr = byBatchDay.get(key) ?? [];
    arr.push(period);
    byBatchDay.set(key, arr);
    const sk = `${p.lesson.subject.id}:${day}`;
    const n = (subjectDay.get(sk) ?? 0) + 1;
    subjectDay.set(sk, n);
    if (n > 1) softBreakdown["Subject repeated in day"]! += wSpread;
    if (p.lesson.subject.subject_type === "Theory" && period >= 4) {
      softBreakdown["Late theory slots"]! += wMorning;
    }
  }
  for (const periods of byBatchDay.values()) {
    const sorted = [...periods].sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i++) {
      const gap = sorted[i]! - sorted[i - 1]! - 1;
      if (gap > 0) softBreakdown["Batch idle gaps"]! += gap * wGaps;
    }
  }

  const hardConflicts = Object.values(hardBreakdown).reduce((a, b) => a + b, 0);
  const softPenalties = Object.values(softBreakdown).reduce((a, b) => a + b, 0);
  const scheduled = placed.length;
  const completion = requiredCount ? scheduled / requiredCount : 0;
  const softNorm = Math.min(35, softPenalties / Math.max(1, requiredCount));
  const fitness = Math.max(
    0,
    Math.min(100, Math.round((100 * completion - 5 * hardConflicts - softNorm) * 10) / 10),
  );

  const capacity = input.rooms.length * SLOT_COUNT;
  const utilization = capacity ? Math.round((scheduled / capacity) * 1000) / 10 : 0;

  const facultyLoad = input.faculty
    .map((f) => ({
      code: f.code,
      name: f.name,
      hours: loadByFaculty.get(f.id) ?? 0,
      max: f.max_hours_per_week,
    }))
    .sort((a, b) => b.hours - a.hours);

  const roomUsageMap = new Map<string, number>();
  for (const p of placed) roomUsageMap.set(p.room.id, (roomUsageMap.get(p.room.id) ?? 0) + 1);
  const roomUsage = input.rooms.map((r) => ({
    code: r.code,
    used: roomUsageMap.get(r.id) ?? 0,
    capacity: SLOT_COUNT,
  }));

  const dayLoad = DAY_SHORT.map((d, i) => ({
    day: d,
    classes: placed.filter((p) => Math.floor(p.slot / PERIOD_COUNT) === i).length,
  }));

  return {
    assignments: placed.map(toAssignment),
    fitness,
    hardConflicts,
    softPenalties: Math.round(softPenalties),
    scheduled,
    required: requiredCount,
    utilization,
    metrics: { hardBreakdown, softBreakdown, convergence, facultyLoad, roomUsage, dayLoad },
  };
}

function difficulty(l: Lesson, rooms: Room[], constraints: Constraint[]) {
  const feasibleRooms = rooms.filter((r) => roomOk(l, r, constraints)).length;
  const blocked = l.faculty
    ? (Array.isArray(l.faculty.unavailable_slots) ? l.faculty.unavailable_slots.length : 0)
    : 0;
  return feasibleRooms * 100 - blocked;
}

type Occupancy = {
  fac: Set<string>;
  room: Set<string>;
  batch: Set<string>;
};

function freshOccupancy(): Occupancy {
  return { fac: new Set(), room: new Set(), batch: new Set() };
}

function canPlace(occ: Occupancy, l: Lesson, slot: number, room: Room, constraints: Constraint[]) {
  if (!roomOk(l, room, constraints)) return false;
  if (facultyBlocked(l.faculty, slot) && weightOf(constraints, "C_FAC_AVAIL", 70) > 0) return false;
  if (occ.batch.has(`${l.batch.id}:${slot}`)) return false;
  if (occ.room.has(`${room.id}:${slot}`)) return false;
  if (l.faculty && occ.fac.has(`${l.faculty.id}:${slot}`)) return false;
  return true;
}

function occupy(occ: Occupancy, l: Lesson, slot: number, room: Room) {
  occ.batch.add(`${l.batch.id}:${slot}`);
  occ.room.add(`${room.id}:${slot}`);
  if (l.faculty) occ.fac.add(`${l.faculty.id}:${slot}`);
}

function release(occ: Occupancy, l: Lesson, slot: number, room: Room) {
  occ.batch.delete(`${l.batch.id}:${slot}`);
  occ.room.delete(`${room.id}:${slot}`);
  if (l.faculty) occ.fac.delete(`${l.faculty.id}:${slot}`);
}

function slotPreference(l: Lesson, slot: number) {
  const period = slot % PERIOD_COUNT;
  return l.subject.subject_type === "Theory" ? period : PERIOD_COUNT - period;
}

/* ------------------------------ GREEDY ------------------------------ */
export function solveGreedy(input: SchedulerInput): SolveResult {
  const start = performance.now();
  const lessons = buildLessons(input);
  const ordered = [...lessons].sort(
    (a, b) => difficulty(a, input.rooms, input.constraints) - difficulty(b, input.rooms, input.constraints),
  );
  const occ = freshOccupancy();
  const placed: Slotted[] = [];
  const convergence: { iteration: number; fitness: number }[] = [];
  let iterations = 0;

  for (const lesson of ordered) {
    const candidates: { slot: number; room: Room; score: number }[] = [];
    for (let slot = 0; slot < SLOT_COUNT; slot++) {
      for (const room of input.rooms) {
        iterations++;
        if (!canPlace(occ, lesson, slot, room, input.constraints)) continue;
        candidates.push({ slot, room, score: slotPreference(lesson, slot) * 10 + room.capacity / 100 });
      }
    }
    candidates.sort((a, b) => a.score - b.score);
    const best = candidates[0];
    if (best) {
      occupy(occ, lesson, best.slot, best.room);
      placed.push({ lesson, slot: best.slot, room: best.room });
    }
    if (placed.length % 5 === 0) {
      convergence.push({
        iteration: placed.length,
        fitness: Math.round((placed.length / lessons.length) * 1000) / 10,
      });
    }
  }

  const evalRes = evaluate(placed, input, lessons.length, convergence);
  return {
    algorithm: "greedy",
    executionMs: Math.round((performance.now() - start) * 100) / 100,
    iterations,
    ...evalRes,
  };
}

/* --------------------------- BACKTRACKING --------------------------- */
export function solveBacktracking(input: SchedulerInput, nodeBudget = 400000): SolveResult {
  const start = performance.now();
  const lessons = buildLessons(input);
  const occ = freshOccupancy();
  const placed: Slotted[] = [];
  const convergence: { iteration: number; fitness: number }[] = [];
  let nodes = 0;
  let best = 0;

  const remaining = [...lessons].sort(
    (a, b) => difficulty(a, input.rooms, input.constraints) - difficulty(b, input.rooms, input.constraints),
  );

  const options = (lesson: Lesson) => {
    const out: { slot: number; room: Room }[] = [];
    for (let slot = 0; slot < SLOT_COUNT; slot++) {
      for (const room of input.rooms) {
        if (canPlace(occ, lesson, slot, room, input.constraints)) out.push({ slot, room });
      }
    }
    return out.sort((a, b) => slotPreference(lesson, a.slot) - slotPreference(lesson, b.slot));
  };

  const search = (index: number): boolean => {
    if (index >= remaining.length) return true;
    if (nodes > nodeBudget) return false;

    // MRV: pick the lesson with fewest remaining options among the next window
    let pick = index;
    let fewest = Infinity;
    const window = Math.min(remaining.length, index + 8);
    for (let i = index; i < window; i++) {
      const count = options(remaining[i]!).length;
      if (count < fewest) {
        fewest = count;
        pick = i;
      }
      if (fewest === 0) break;
    }
    [remaining[index], remaining[pick]] = [remaining[pick]!, remaining[index]!];
    const lesson = remaining[index]!;

    for (const opt of options(lesson)) {
      nodes++;
      if (nodes > nodeBudget) return false;
      occupy(occ, lesson, opt.slot, opt.room);
      placed.push({ lesson, slot: opt.slot, room: opt.room });
      if (placed.length > best) {
        best = placed.length;
        convergence.push({
          iteration: nodes,
          fitness: Math.round((best / lessons.length) * 1000) / 10,
        });
      }
      if (search(index + 1)) return true;
      placed.pop();
      release(occ, lesson, opt.slot, opt.room);
    }
    return false;
  };

  search(0);
  const evalRes = evaluate(placed, input, lessons.length, convergence);
  return {
    algorithm: "backtracking",
    executionMs: Math.round((performance.now() - start) * 100) / 100,
    iterations: nodes,
    ...evalRes,
  };
}

/* ------------------------------ GENETIC ------------------------------ */
type Gene = { slot: number; roomIndex: number };

export function solveGenetic(
  input: SchedulerInput,
  opts: { population?: number; generations?: number; mutationRate?: number; elite?: number } = {},
): SolveResult {
  const start = performance.now();
  const populationSize = opts.population ?? 60;
  const generations = opts.generations ?? 80;
  const mutationRate = opts.mutationRate ?? 0.08;
  const eliteCount = opts.elite ?? 4;

  const lessons = buildLessons(input);
  const rooms = input.rooms;
  const convergence: { iteration: number; fitness: number }[] = [];

  if (!lessons.length || !rooms.length) {
    const evalRes = evaluate([], input, lessons.length, convergence);
    return {
      algorithm: "genetic",
      executionMs: Math.round((performance.now() - start) * 100) / 100,
      iterations: 0,
      ...evalRes,
    };
  }

  const feasibleRoomIdx = lessons.map((l) => {
    const idx = rooms.map((r, i) => ({ r, i })).filter((x) => roomOk(l, x.r, input.constraints)).map((x) => x.i);
    return idx.length ? idx : rooms.map((_, i) => i);
  });

  const randomGene = (li: number): Gene => ({
    slot: Math.floor(Math.random() * SLOT_COUNT),
    roomIndex: feasibleRoomIdx[li]![Math.floor(Math.random() * feasibleRoomIdx[li]!.length)]!,
  });

  const toPlaced = (chrom: Gene[]): Slotted[] =>
    chrom.map((g, i) => ({ lesson: lessons[i]!, slot: g.slot, room: rooms[g.roomIndex]! }));

  const score = (chrom: Gene[]) => evaluate(toPlaced(chrom), input, lessons.length).fitness;

  // seeded population: half randomized-greedy, half random
  const seedGreedy = (): Gene[] => {
    const occ = freshOccupancy();
    const order = lessons.map((_, i) => i).sort(() => Math.random() - 0.5);
    const chrom: Gene[] = lessons.map((_, i) => randomGene(i));
    for (const li of order) {
      const lesson = lessons[li]!;
      const slots = Array.from({ length: SLOT_COUNT }, (_, s) => s).sort(() => Math.random() - 0.5);
      outer: for (const slot of slots) {
        for (const ri of feasibleRoomIdx[li]!) {
          if (canPlace(occ, lesson, slot, rooms[ri]!, input.constraints)) {
            occupy(occ, lesson, slot, rooms[ri]!);
            chrom[li] = { slot, roomIndex: ri };
            break outer;
          }
        }
      }
    }
    return chrom;
  };

  let population: Gene[][] = Array.from({ length: populationSize }, (_, i) =>
    i % 2 === 0 ? seedGreedy() : lessons.map((_, li) => randomGene(li)),
  );

  let bestChrom = population[0]!;
  let bestScore = score(bestChrom);
  let evaluations = 0;

  for (let gen = 0; gen < generations; gen++) {
    const scored = population.map((chrom) => {
      evaluations++;
      return { chrom, fit: score(chrom) };
    });
    scored.sort((a, b) => b.fit - a.fit);
    if (scored[0]!.fit > bestScore) {
      bestScore = scored[0]!.fit;
      bestChrom = scored[0]!.chrom;
    }
    convergence.push({ iteration: gen + 1, fitness: bestScore });

    const next: Gene[][] = scored.slice(0, eliteCount).map((s) => s.chrom.map((g) => ({ ...g })));
    const tournament = () => {
      const a = scored[Math.floor(Math.random() * scored.length)]!;
      const b = scored[Math.floor(Math.random() * scored.length)]!;
      return a.fit >= b.fit ? a.chrom : b.chrom;
    };

    while (next.length < populationSize) {
      const p1 = tournament();
      const p2 = tournament();
      const child: Gene[] = p1.map((g, i) => (Math.random() < 0.5 ? { ...g } : { ...p2[i]! }));
      for (let i = 0; i < child.length; i++) {
        if (Math.random() < mutationRate) child[i] = randomGene(i);
      }
      next.push(child);
    }
    population = next;
  }

  const evalRes = evaluate(toPlaced(bestChrom), input, lessons.length, convergence);
  return {
    algorithm: "genetic",
    executionMs: Math.round((performance.now() - start) * 100) / 100,
    iterations: evaluations,
    ...evalRes,
  };
}

export function solve(algorithm: AlgorithmKey, input: SchedulerInput): SolveResult {
  if (algorithm === "greedy") return solveGreedy(input);
  if (algorithm === "backtracking") return solveBacktracking(input);
  return solveGenetic(input);
}
