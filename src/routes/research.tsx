import { createFileRoute } from "@tanstack/react-router";
import { DataTable, Loading, PageHead, Panel, Stat, Tag } from "@/components/brutal";
import { ColoredBarBlock } from "@/components/Charts";
import { PALETTE } from "@/lib/palette";
import { useCoreData } from "@/lib/useData";
import { ALGORITHMS } from "@/lib/scheduler";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "Research Report — Timetable OPT" },
      {
        name: "description",
        content:
          "Methodology, complexity analysis and empirical findings for greedy, backtracking and genetic timetable scheduling.",
      },
      { property: "og:title", content: "Research Report — Timetable OPT" },
      {
        property: "og:description",
        content: "Methodology, complexity and findings for timetable optimization.",
      },
    ],
  }),
  component: ResearchPage,
});

const COMPLEXITY = [
  {
    algo: "Greedy Heuristic",
    time: "O(L · S · R)",
    space: "O(L)",
    completeness: "Incomplete",
    optimality: "None",
    note: "One irrevocable decision per lesson; fails when early choices block later ones.",
  },
  {
    algo: "Backtracking / CSP",
    time: "O(b^d) worst case",
    space: "O(d)",
    completeness: "Complete within node budget",
    optimality: "First feasible solution",
    note: "MRV ordering and forward checking prune most of the tree on realistic instances.",
  },
  {
    algo: "Genetic Algorithm",
    time: "O(G · P · L)",
    space: "O(P · L)",
    completeness: "Stochastic",
    optimality: "Approximate, anytime",
    note: "Optimises soft objectives well but needs repair or penalties for hard feasibility.",
  },
];

function ResearchPage() {
  const data = useCoreData();
  if (data.isLoading) return <Loading />;

  const saved = data.timetables;
  const perAlgo = ALGORITHMS.map((a) => {
    const runs = saved.filter((t) => t.algorithm === a.key);
    const n = runs.length || 1;
    return {
      name: a.label.split(" ")[0],
      label: a.label,
      runs: runs.length,
      fitness: Math.round((runs.reduce((s, r) => s + Number(r.fitness), 0) / n) * 10) / 10,
      conflicts: Math.round((runs.reduce((s, r) => s + r.hard_conflicts, 0) / n) * 10) / 10,
      ms: Math.round((runs.reduce((s, r) => s + Number(r.execution_ms), 0) / n) * 100) / 100,
    };
  });

  return (
    <div>
      <PageHead
        eyebrow="Research / 02"
        title="Research Report"
        description="A written account of the problem formulation, algorithms, evaluation model and observed results."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Saved experiments" value={saved.length} tone="sun" />
        <Stat
          label="Decision variables"
          value={data.subjects.reduce((s, x) => s + x.hours_per_week, 0)}
        />
        <Stat label="Search space slots" value={data.rooms.length * 35} tone="cobalt" />
        <Stat
          label="Constraints modelled"
          value={data.constraints.length}
          tone="orchid"
          hint={`${data.constraints.filter((c) => c.constraint_type === "Hard").length} hard / ${data.constraints.filter((c) => c.constraint_type !== "Hard").length} soft`}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Panel title="1 · Problem formulation" accent="sun" className="xl:col-span-2">
          <div className="space-y-3 p-5 text-sm leading-relaxed">
            <p>
              University course timetabling is modelled here as a constraint satisfaction and
              optimisation problem. Every subject contributes one lesson unit per weekly contact
              hour; each unit must be assigned a time slot from a 5-day × 7-period grid and a room
              from the inventory.
            </p>
            <p>
              A candidate solution is a complete mapping <em>lesson → (slot, room)</em>. Hard
              constraints define feasibility: no faculty, room or batch may be double-booked, labs
              require lab rooms, room capacity must cover batch strength, and faculty availability
              blocks are absolute.
            </p>
            <p>
              Soft constraints shape quality: weekly load ceilings, idle gaps for students,
              spreading a subject across the week, and a preference for morning theory sessions.
              Each carries an editable weight, so the objective function can be re-tuned without
              touching the solvers.
            </p>
          </div>
        </Panel>

        <Panel title="2 · Objective function" accent="cobalt">
          <div className="space-y-3 p-5 font-mono text-xs leading-relaxed uppercase">
            <p className="brutal-border bg-background p-3">
              fitness = 100 · (placed / required) − 5 · hard − min(35, soft / required)
            </p>
            <p className="text-muted-foreground">
              Scores are clamped to 0–100. Hard violations dominate; soft penalties are normalised
              by instance size so results stay comparable across datasets.
            </p>
          </div>
        </Panel>
      </div>

      <div className="mt-6 space-y-6">
        <Panel title="3 · Algorithms and complexity" accent="orchid">
          <DataTable
            head={["Algorithm", "Time", "Space", "Completeness", "Optimality", "Behaviour"]}
          >
            {COMPLEXITY.map((c) => (
              <tr key={c.algo} className="border-b-2 border-ink/10 align-top">
                <td className="px-3 py-2 font-bold uppercase">{c.algo}</td>
                <td className="px-3 py-2">{c.time}</td>
                <td className="px-3 py-2">{c.space}</td>
                <td className="px-3 py-2">{c.completeness}</td>
                <td className="px-3 py-2">{c.optimality}</td>
                <td className="px-3 py-2 normal-case">{c.note}</td>
              </tr>
            ))}
          </DataTable>
          <p className="border-t-2 border-ink/10 px-4 py-3 font-mono text-[10px] uppercase">
            L = lesson units · S = time slots · R = rooms · b = branching factor · d = depth · G =
            generations · P = population
          </p>
        </Panel>

        <div className="grid gap-6 xl:grid-cols-2">
          <Panel
            title="4 · Empirical results"
            subtitle="Averaged over saved experiments"
            accent="signal"
          >
            <DataTable head={["Algorithm", "Runs", "Avg fitness", "Avg conflicts", "Avg runtime"]}>
              {perAlgo.map((p) => (
                <tr key={p.label} className="border-b-2 border-ink/10">
                  <td className="px-3 py-2 font-bold uppercase">{p.label}</td>
                  <td className="px-3 py-2">{p.runs}</td>
                  <td className="px-3 py-2">{p.runs ? p.fitness : "—"}</td>
                  <td className="px-3 py-2">
                    {p.runs ? <Tag tone={p.conflicts ? "signal" : "mint"}>{p.conflicts}</Tag> : "—"}
                  </td>
                  <td className="px-3 py-2">{p.runs ? `${p.ms} ms` : "—"}</td>
                </tr>
              ))}
            </DataTable>
          </Panel>

          <Panel title="Average fitness of saved runs" accent="sun">
            <div className="p-4">
              <ColoredBarBlock
                data={perAlgo as unknown as Record<string, unknown>[]}
                xKey="name"
                yKey="fitness"
                colors={[PALETTE.sun, PALETTE.cobalt, PALETTE.orchid]}
              />
            </div>
          </Panel>
        </div>

        <Panel title="5 · Discussion and future work" accent="cobalt">
          <div className="grid gap-5 p-5 text-sm leading-relaxed md:grid-cols-3">
            <div>
              <h3 className="text-sm">Findings</h3>
              <p className="mt-2 text-muted-foreground">
                Greedy placement is effectively instantaneous and usually feasible, but leaves gaps
                and late theory slots untouched. Backtracking recovers the placements greedy loses
                at a visible cost in explored nodes. The genetic algorithm produces the smoothest
                student timetables once given enough generations, at the highest runtime.
              </p>
            </div>
            <div>
              <h3 className="text-sm">Threats to validity</h3>
              <p className="mt-2 text-muted-foreground">
                Results depend on a single institution-scale instance and on weights chosen by the
                operator. Runtimes are measured in the browser, so they reflect relative rather than
                absolute cost.
              </p>
            </div>
            <div>
              <h3 className="text-sm">Future work</h3>
              <p className="mt-2 text-muted-foreground">
                Hybridise GA with a local-repair operator, add simulated annealing and tabu search
                baselines, support multi-campus room travel time, and run statistical significance
                tests over larger trial counts.
              </p>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
