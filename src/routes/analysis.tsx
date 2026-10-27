import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { FlaskConical } from "lucide-react";
import {
  Btn,
  DataTable,
  Field,
  Loading,
  PageHead,
  Panel,
  Stat,
  Tag,
  TextInput,
} from "@/components/brutal";
import { ColoredBarBlock, LineChartBlock, RadarBlock } from "@/components/Charts";
import { PALETTE } from "@/lib/palette";
import { useCoreData } from "@/lib/useData";
import {
  ALGORITHMS,
  solveBacktracking,
  solveGenetic,
  solveGreedy,
  type AlgorithmKey,
  type SolveResult,
} from "@/lib/scheduler";

export const Route = createFileRoute("/analysis")({
  head: () => ({
    meta: [
      { title: "Algorithm Analysis — Timetable OPT" },
      {
        name: "description",
        content: "Benchmark Greedy, Backtracking and Genetic schedulers across repeated trials.",
      },
      { property: "og:title", content: "Algorithm Analysis — Timetable OPT" },
      {
        property: "og:description",
        content: "Repeated-trial benchmarking of three timetable optimizers.",
      },
    ],
  }),
  component: AnalysisPage,
});

type Aggregate = {
  key: AlgorithmKey;
  label: string;
  trials: number;
  avgFitness: number;
  bestFitness: number;
  worstFitness: number;
  stdDev: number;
  avgConflicts: number;
  avgMs: number;
  avgPlaced: number;
  required: number;
};

function AnalysisPage() {
  const data = useCoreData();
  const [trials, setTrials] = useState(3);
  const [running, setRunning] = useState(false);
  const [aggregates, setAggregates] = useState<Aggregate[]>([]);
  const [convergence, setConvergence] = useState<Record<string, unknown>[]>([]);

  const input = {
    faculty: data.faculty,
    rooms: data.rooms,
    batches: data.batches,
    subjects: data.subjects,
    constraints: data.constraints,
  };

  const runBenchmark = async () => {
    setRunning(true);
    await new Promise((r) => setTimeout(r, 40));
    const out: Aggregate[] = [];
    const curves: Record<string, { iteration: number; fitness: number }[]> = {};

    for (const algo of ALGORITHMS) {
      const runs: SolveResult[] = [];
      for (let i = 0; i < trials; i++) {
        if (algo.key === "greedy") runs.push(solveGreedy(input));
        else if (algo.key === "backtracking") runs.push(solveBacktracking(input));
        else runs.push(solveGenetic(input, { generations: 60, population: 50 }));
        await new Promise((r) => setTimeout(r, 10));
      }
      const fits = runs.map((r) => r.fitness);
      const mean = fits.reduce((a, b) => a + b, 0) / fits.length;
      const variance = fits.reduce((a, b) => a + (b - mean) ** 2, 0) / fits.length;
      out.push({
        key: algo.key,
        label: algo.label,
        trials,
        avgFitness: Math.round(mean * 10) / 10,
        bestFitness: Math.max(...fits),
        worstFitness: Math.min(...fits),
        stdDev: Math.round(Math.sqrt(variance) * 100) / 100,
        avgConflicts:
          Math.round((runs.reduce((a, r) => a + r.hardConflicts, 0) / runs.length) * 10) / 10,
        avgMs: Math.round((runs.reduce((a, r) => a + r.executionMs, 0) / runs.length) * 100) / 100,
        avgPlaced: Math.round(runs.reduce((a, r) => a + r.scheduled, 0) / runs.length),
        required: runs[0]?.required ?? 0,
      });
      curves[algo.key] = runs[runs.length - 1]?.metrics.convergence ?? [];
      setAggregates([...out]);
    }

    // normalise convergence curves onto a common 0-100 progress axis
    const points = 20;
    const merged: Record<string, unknown>[] = [];
    for (let p = 0; p <= points; p++) {
      const row: Record<string, unknown> = { progress: Math.round((p / points) * 100) };
      for (const algo of ALGORITHMS) {
        const curve = curves[algo.key] ?? [];
        if (!curve.length) continue;
        const idx = Math.min(curve.length - 1, Math.floor((p / points) * (curve.length - 1)));
        row[algo.key] = curve[idx]!.fitness;
      }
      merged.push(row);
    }
    setConvergence(merged);
    setRunning(false);
    toast.success(`Benchmark complete — ${trials} trials per algorithm`);
  };

  if (data.isLoading) return <Loading />;

  const radar = aggregates.length
    ? [
        {
          metric: "Fitness",
          ...Object.fromEntries(aggregates.map((a) => [a.key, a.avgFitness])),
        },
        {
          metric: "Speed",
          ...Object.fromEntries(
            aggregates.map((a) => [
              a.key,
              Math.round((1 - a.avgMs / Math.max(...aggregates.map((x) => x.avgMs || 1))) * 100),
            ]),
          ),
        },
        {
          metric: "Feasibility",
          ...Object.fromEntries(
            aggregates.map((a) => [a.key, Math.max(0, 100 - a.avgConflicts * 10)]),
          ),
        },
        {
          metric: "Coverage",
          ...Object.fromEntries(
            aggregates.map((a) => [
              a.key,
              Math.round((a.avgPlaced / Math.max(1, a.required)) * 100),
            ]),
          ),
        },
        {
          metric: "Stability",
          ...Object.fromEntries(aggregates.map((a) => [a.key, Math.max(0, 100 - a.stdDev * 8)])),
        },
      ]
    : [];

  return (
    <div>
      <PageHead
        eyebrow="Research / 01"
        title="Algorithm Analysis"
        description="Repeated trials on the same problem instance, comparing solution quality, feasibility and computational cost."
        actions={
          <div className="flex items-end gap-2">
            <div className="w-24">
              <Field label="Trials">
                <TextInput
                  type="number"
                  value={trials}
                  onChange={(e) => setTrials(Number(e.target.value) || 1)}
                />
              </Field>
            </div>
            <Btn variant="cobalt" onClick={runBenchmark} disabled={running}>
              <FlaskConical className="size-3" /> {running ? "Benchmarking…" : "Run benchmark"}
            </Btn>
          </div>
        }
      />

      {aggregates.length === 0 ? (
        <Panel
          title="No benchmark data"
          subtitle="Run the benchmark to populate this page"
          accent="sun"
        >
          <p className="p-6 font-mono text-xs text-muted-foreground uppercase">
            Each trial re-solves the current dataset from scratch. Greedy and CSP are deterministic;
            the genetic algorithm is stochastic, so its spread across trials is the interesting
            signal.
          </p>
        </Panel>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat
              label="Highest average fitness"
              value={
                [...aggregates].sort((a, b) => b.avgFitness - a.avgFitness)[0]!.label.split(" ")[0]!
              }
              tone="sun"
            />
            <Stat
              label="Fastest solver"
              value={[...aggregates].sort((a, b) => a.avgMs - b.avgMs)[0]!.label.split(" ")[0]!}
              tone="cobalt"
            />
            <Stat
              label="Most feasible"
              value={
                [...aggregates]
                  .sort((a, b) => a.avgConflicts - b.avgConflicts)[0]!
                  .label.split(" ")[0]!
              }
              tone="orchid"
            />
            <Stat label="Trials per algorithm" value={trials} />
          </div>

          <Panel title="Benchmark table" subtitle="Aggregated over all trials" accent="sun">
            <DataTable
              head={[
                "Algorithm",
                "Avg fitness",
                "Best",
                "Worst",
                "Std dev",
                "Avg conflicts",
                "Avg runtime",
                "Placed",
              ]}
            >
              {aggregates.map((a) => (
                <tr key={a.key} className="border-b-2 border-ink/10">
                  <td className="px-3 py-2 font-bold uppercase">{a.label}</td>
                  <td className="px-3 py-2">{a.avgFitness}</td>
                  <td className="px-3 py-2">{a.bestFitness}</td>
                  <td className="px-3 py-2">{a.worstFitness}</td>
                  <td className="px-3 py-2">{a.stdDev}</td>
                  <td className="px-3 py-2">
                    <Tag tone={a.avgConflicts ? "signal" : "mint"}>{a.avgConflicts}</Tag>
                  </td>
                  <td className="px-3 py-2">{a.avgMs} ms</td>
                  <td className="px-3 py-2">
                    {a.avgPlaced}/{a.required}
                  </td>
                </tr>
              ))}
            </DataTable>
          </Panel>

          <div className="grid gap-6 xl:grid-cols-2">
            <Panel title="Average fitness" subtitle="Higher is better" accent="sun">
              <div className="p-4">
                <ColoredBarBlock
                  data={aggregates.map((a) => ({
                    name: a.label.split(" ")[0],
                    value: a.avgFitness,
                  }))}
                  xKey="name"
                  yKey="value"
                  colors={[PALETTE.sun, PALETTE.cobalt, PALETTE.orchid]}
                />
              </div>
            </Panel>
            <Panel title="Average runtime" subtitle="Milliseconds, lower is better" accent="signal">
              <div className="p-4">
                <ColoredBarBlock
                  data={aggregates.map((a) => ({ name: a.label.split(" ")[0], value: a.avgMs }))}
                  xKey="name"
                  yKey="value"
                  colors={[PALETTE.signal]}
                />
              </div>
            </Panel>
            <Panel
              title="Convergence profile"
              subtitle="Normalised search progress"
              accent="cobalt"
            >
              <div className="p-4">
                <LineChartBlock
                  data={convergence}
                  xKey="progress"
                  lines={[
                    { key: "greedy", color: PALETTE.sun, name: "Greedy" },
                    { key: "backtracking", color: PALETTE.cobalt, name: "Backtracking" },
                    { key: "genetic", color: PALETTE.orchid, name: "Genetic" },
                  ]}
                />
              </div>
            </Panel>
            <Panel
              title="Multi-criteria profile"
              subtitle="Normalised 0-100 across five axes"
              accent="orchid"
            >
              <div className="p-4">
                <RadarBlock
                  data={radar}
                  series={aggregates.map((a) => ({
                    key: a.key,
                    color:
                      a.key === "greedy"
                        ? PALETTE.sun
                        : a.key === "backtracking"
                          ? PALETTE.cobalt
                          : PALETTE.orchid,
                  }))}
                />
              </div>
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
}
