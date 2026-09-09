import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Play, Save, Zap } from "lucide-react";
import { Btn, Field, PageHead, Panel, Stat, Tag, TextInput } from "@/components/brutal";
import { TimetableGrid } from "@/components/TimetableGrid";
import { useCoreData } from "@/lib/useData";
import { insertRow } from "@/lib/queries";
import {
  ALGORITHMS,
  buildLessons,
  solveBacktracking,
  solveGenetic,
  solveGreedy,
  type AlgorithmKey,
  type SolveResult,
} from "@/lib/scheduler";
import { cn } from "@/lib/utils";
import { Loading } from "./faculty";

export const Route = createFileRoute("/generate")({
  head: () => ({
    meta: [
      { title: "Timetable Generator — Timetable OPT" },
      {
        name: "description",
        content: "Run Greedy, Backtracking and Genetic optimizers and compare fitness, conflicts and runtime.",
      },
      { property: "og:title", content: "Timetable Generator — Timetable OPT" },
      { property: "og:description", content: "Run and compare three scheduling optimizers side by side." },
    ],
  }),
  component: GeneratePage,
});

function GeneratePage() {
  const data = useCoreData();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<AlgorithmKey[]>(["greedy", "backtracking", "genetic"]);
  const [population, setPopulation] = useState(60);
  const [generations, setGenerations] = useState(80);
  const [mutation, setMutation] = useState(8);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<SolveResult[]>([]);
  const [preview, setPreview] = useState<AlgorithmKey | null>(null);
  const [saving, setSaving] = useState(false);

  const input = {
    faculty: data.faculty,
    rooms: data.rooms,
    batches: data.batches,
    subjects: data.subjects,
    constraints: data.constraints,
  };
  const lessonCount = data.isLoading ? 0 : buildLessons(input).length;

  const run = async () => {
    if (!selected.length) return toast.error("Select at least one algorithm");
    setRunning(true);
    setResults([]);
    await new Promise((r) => setTimeout(r, 40));
    const out: SolveResult[] = [];
    for (const algo of selected) {
      if (algo === "greedy") out.push(solveGreedy(input));
      if (algo === "backtracking") out.push(solveBacktracking(input));
      if (algo === "genetic")
        out.push(
          solveGenetic(input, { population, generations, mutationRate: mutation / 100 }),
        );
      setResults([...out]);
      await new Promise((r) => setTimeout(r, 20));
    }
    setRunning(false);
    setPreview(out[0]?.algorithm ?? null);
    toast.success(`${out.length} optimizer run(s) complete`);
  };

  const saveRun = async (res: SolveResult) => {
    setSaving(true);
    try {
      const label = ALGORITHMS.find((a) => a.key === res.algorithm)?.label ?? res.algorithm;
      const row = await insertRow("timetables", {
        name: `${label} · ${new Date().toLocaleString()}`,
        algorithm: res.algorithm,
        fitness: res.fitness,
        hard_conflicts: res.hardConflicts,
        soft_penalties: res.softPenalties,
        execution_ms: res.executionMs,
        iterations: res.iterations,
        scheduled_count: res.scheduled,
        required_count: res.required,
        utilization: res.utilization,
        entries: res.assignments,
        metrics: res.metrics,
      });
      qc.invalidateQueries({ queryKey: ["timetables"] });
      toast.success("Timetable saved");
      navigate({ to: "/timetables/$id", params: { id: (row as { id: string }).id } });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const previewResult = results.find((r) => r.algorithm === preview);

  return (
    <div>
      <PageHead
        eyebrow="Optimization / 01"
        title="Timetable Generator"
        description="Each optimizer receives the same problem instance so runtime and quality are directly comparable."
        actions={
          <Btn onClick={run} disabled={running || data.isLoading} variant="cobalt">
            <Play className="size-3" /> {running ? "Running…" : "Run optimizers"}
          </Btn>
        }
      />

      {data.isLoading ? (
        <Loading />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Lesson units to place" value={lessonCount} tone="sun" />
            <Stat label="Batches" value={data.batches.length} />
            <Stat label="Rooms × slots" value={data.rooms.length * 35} />
            <Stat
              label="Active constraints"
              value={data.constraints.filter((c) => c.enabled).length}
              hint={`${data.constraints.filter((c) => c.constraint_type === "Hard" && c.enabled).length} hard`}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <Panel title="Algorithm selection" subtitle="Toggle which solvers to execute" accent="sun">
              <ul className="divide-y-2 divide-ink/10">
                {ALGORITHMS.map((a) => {
                  const on = selected.includes(a.key);
                  return (
                    <li key={a.key}>
                      <button
                        onClick={() =>
                          setSelected((s) => (on ? s.filter((x) => x !== a.key) : [...s, a.key]))
                        }
                        className={cn(
                          "flex w-full items-start gap-3 p-4 text-left hover:bg-sun/20",
                          on && "bg-sun/30",
                        )}
                      >
                        <span
                          className={cn(
                            "brutal-border mt-0.5 grid size-5 shrink-0 place-items-center text-[10px] font-bold",
                            on ? "bg-ink text-paper" : "bg-card",
                          )}
                        >
                          {on ? "✓" : ""}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-mono text-xs font-bold uppercase">{a.label}</span>
                          <span className="mt-1 block text-xs text-muted-foreground">{a.blurb}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Panel>

            <Panel title="Genetic parameters" subtitle="Applies to the GA solver only" accent="orchid">
              <div className="grid gap-4 p-4 sm:grid-cols-3 xl:grid-cols-1">
                <Field label="Population size">
                  <TextInput
                    type="number"
                    value={population}
                    onChange={(e) => setPopulation(Number(e.target.value))}
                  />
                </Field>
                <Field label="Generations">
                  <TextInput
                    type="number"
                    value={generations}
                    onChange={(e) => setGenerations(Number(e.target.value))}
                  />
                </Field>
                <Field label="Mutation rate (%)">
                  <TextInput
                    type="number"
                    value={mutation}
                    onChange={(e) => setMutation(Number(e.target.value))}
                  />
                </Field>
              </div>
            </Panel>

            <Panel title="Run log" subtitle="Live results from this session" accent="cobalt">
              <div className="space-y-3 p-4">
                {running ? (
                  <p className="flex items-center gap-2 font-mono text-xs uppercase">
                    <Zap className="size-4 animate-pulse" /> Solving…
                  </p>
                ) : null}
                {results.length === 0 && !running ? (
                  <p className="font-mono text-xs text-muted-foreground uppercase">
                    No runs yet. Press “Run optimizers”.
                  </p>
                ) : null}
                {results.map((r) => (
                  <div key={r.algorithm} className="brutal-border bg-background p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-mono text-xs font-bold uppercase">
                        {ALGORITHMS.find((a) => a.key === r.algorithm)?.label}
                      </p>
                      <Tag tone={r.hardConflicts === 0 ? "mint" : "signal"}>
                        {r.hardConflicts === 0 ? "Feasible" : `${r.hardConflicts} conflicts`}
                      </Tag>
                    </div>
                    <p className="mt-2 font-mono text-[11px]">
                      Fitness {r.fitness} · {r.executionMs} ms · {r.scheduled}/{r.required} placed
                    </p>
                    <div className="mt-2 flex gap-2">
                      <Btn size="sm" variant="ghost" onClick={() => setPreview(r.algorithm)}>
                        Preview
                      </Btn>
                      <Btn size="sm" disabled={saving} onClick={() => saveRun(r)}>
                        <Save className="size-3" /> Save
                      </Btn>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          {results.length > 1 ? (
            <Panel title="Comparison matrix" subtitle="Same instance, three search strategies" accent="signal">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-ink text-paper">
                      {["Algorithm", "Fitness", "Hard conflicts", "Soft penalty", "Placed", "Runtime", "Iterations", "Room utilisation"].map(
                        (h) => (
                          <th key={h} className="px-3 py-2 font-mono text-[10px] tracking-wider uppercase">
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody className="font-mono text-xs">
                    {results.map((r) => (
                      <tr key={r.algorithm} className="border-b-2 border-ink/10">
                        <td className="px-3 py-2 font-bold uppercase">
                          {ALGORITHMS.find((a) => a.key === r.algorithm)?.label}
                        </td>
                        <td className="px-3 py-2">{r.fitness}</td>
                        <td className="px-3 py-2">{r.hardConflicts}</td>
                        <td className="px-3 py-2">{r.softPenalties}</td>
                        <td className="px-3 py-2">
                          {r.scheduled}/{r.required}
                        </td>
                        <td className="px-3 py-2">{r.executionMs} ms</td>
                        <td className="px-3 py-2">{r.iterations.toLocaleString()}</td>
                        <td className="px-3 py-2">{r.utilization}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          ) : null}

          {previewResult ? (
            <Panel
              title={`Preview — ${ALGORITHMS.find((a) => a.key === previewResult.algorithm)?.label}`}
              subtitle="Unsaved draft schedule"
              accent="cobalt"
              right={
                <Btn size="sm" onClick={() => saveRun(previewResult)} disabled={saving}>
                  <Save className="size-3" /> Save this run
                </Btn>
              }
            >
              <div className="p-4">
                <TimetableGrid entries={previewResult.assignments} />
              </div>
            </Panel>
          ) : null}
        </div>
      )}
    </div>
  );
}
