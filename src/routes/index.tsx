import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Cpu } from "lucide-react";
import { PageHead, Panel, Stat, Tag } from "@/components/brutal";
import { ColoredBarBlock, PALETTE } from "@/components/Charts";
import { useCoreData } from "@/lib/useData";
import { ALGORITHMS, buildLessons } from "@/lib/scheduler";
import { Loading } from "./faculty";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Intelligent College Timetable Optimization" },
      {
        name: "description",
        content:
          "Overview of faculty, subjects, rooms and optimizer runs for the intelligent college timetable scheduling platform.",
      },
      { property: "og:title", content: "Dashboard — Intelligent College Timetable Optimization" },
      {
        property: "og:description",
        content: "Manage scheduling data and compare Greedy, Backtracking and Genetic timetable optimizers.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const data = useCoreData();
  if (data.isLoading) return <Loading />;

  const lessons = buildLessons({
    faculty: data.faculty,
    rooms: data.rooms,
    batches: data.batches,
    subjects: data.subjects,
    constraints: data.constraints,
  }).length;

  const best = [...data.timetables].sort((a, b) => b.fitness - a.fitness)[0];
  const byAlgo = ALGORITHMS.map((a) => {
    const runs = data.timetables.filter((t) => t.algorithm === a.key);
    const avg = runs.length ? runs.reduce((s, r) => s + Number(r.fitness), 0) / runs.length : 0;
    return { algorithm: a.label.split(" ")[0], runs: runs.length, avg: Math.round(avg * 10) / 10 };
  });

  const deptLoad = [...new Set(data.batches.map((b) => b.department))].map((d) => ({
    dept: d,
    hours: data.subjects
      .filter((s) => data.batches.find((b) => b.id === s.batch_id)?.department === d)
      .reduce((sum, s) => sum + s.hours_per_week, 0),
  }));

  return (
    <div>
      <PageHead
        eyebrow="Overview"
        title="Scheduling Control Room"
        description="An experimental platform for generating college timetables with three distinct search strategies and measuring what each one costs."
        actions={
          <Link
            to="/generate"
            className="brutal-border inline-flex items-center gap-2 bg-ink px-4 py-2.5 font-mono text-xs font-bold tracking-wider text-paper uppercase shadow-[3px_3px_0_0_var(--ink)]"
          >
            <Cpu className="size-3" /> Open generator
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Faculty" value={data.faculty.length} tone="sun" hint="Teaching staff on record" />
        <Stat label="Subjects" value={data.subjects.length} hint={`${lessons} weekly lesson units`} />
        <Stat label="Rooms" value={data.rooms.length} tone="cobalt" hint={`${data.rooms.length * 35} room-slots`} />
        <Stat label="Batches" value={data.batches.length} tone="orchid" hint="Independent class groups" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Panel title="Best saved timetable" subtitle="Highest fitness across all runs" accent="sun" className="xl:col-span-1">
          <div className="p-4">
            {best ? (
              <>
                <p className="font-display text-5xl leading-none">{best.fitness}</p>
                <p className="mt-2 font-mono text-[11px] uppercase">
                  {ALGORITHMS.find((a) => a.key === best.algorithm)?.label}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Tag tone={best.hard_conflicts ? "signal" : "mint"}>
                    {best.hard_conflicts} hard conflicts
                  </Tag>
                  <Tag tone="cobalt">{best.execution_ms} ms</Tag>
                  <Tag tone="ink">
                    {best.scheduled_count}/{best.required_count} placed
                  </Tag>
                </div>
                <Link
                  to="/timetables/$id"
                  params={{ id: best.id }}
                  className="brutal-border mt-5 inline-flex items-center gap-2 bg-ink px-3 py-2 font-mono text-[11px] font-bold text-paper uppercase"
                >
                  Open timetable <ArrowUpRight className="size-3" />
                </Link>
              </>
            ) : (
              <p className="font-mono text-xs text-muted-foreground uppercase">
                No runs saved yet. Head to the generator to create one.
              </p>
            )}
          </div>
        </Panel>

        <Panel title="Average fitness by algorithm" subtitle="From saved runs" accent="cobalt" className="xl:col-span-2">
          <div className="p-4">
            <ColoredBarBlock
              data={byAlgo as unknown as Record<string, unknown>[]}
              xKey="algorithm"
              yKey="avg"
              colors={[PALETTE.sun, PALETTE.cobalt, PALETTE.orchid]}
            />
          </div>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Teaching hours by department" subtitle="Weekly demand" accent="orchid">
          <div className="p-4">
            <ColoredBarBlock
              data={deptLoad as unknown as Record<string, unknown>[]}
              xKey="dept"
              yKey="hours"
              colors={[PALETTE.orchid, PALETTE.mint, PALETTE.sun, PALETTE.cobalt]}
            />
          </div>
        </Panel>

        <Panel title="Recent runs" subtitle="Latest five optimizer executions" accent="signal">
          <ul className="divide-y-2 divide-ink/10">
            {data.timetables.slice(0, 5).map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-mono text-xs font-bold uppercase">
                    {ALGORITHMS.find((a) => a.key === t.algorithm)?.label}
                  </p>
                  <p className="font-mono text-[10px] text-muted-foreground uppercase">
                    fitness {t.fitness} · {t.execution_ms} ms · {t.hard_conflicts} conflicts
                  </p>
                </div>
                <Link
                  to="/timetables/$id"
                  params={{ id: t.id }}
                  className="brutal-border bg-card px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase"
                >
                  View
                </Link>
              </li>
            ))}
            {data.timetables.length === 0 ? (
              <li className="px-4 py-6 text-center font-mono text-xs text-muted-foreground uppercase">
                Nothing generated yet
              </li>
            ) : null}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
