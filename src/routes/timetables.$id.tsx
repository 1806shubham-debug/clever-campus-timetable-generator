import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowLeft, Download } from "lucide-react";
import { Btn, PageHead, Panel, SelectInput, Stat, Tag } from "@/components/brutal";
import { TimetableGrid } from "@/components/TimetableGrid";
import { BarChartBlock, ColoredBarBlock, LineChartBlock, PALETTE } from "@/components/Charts";
import { timetableQuery } from "@/lib/queries";
import { ALGORITHMS } from "@/lib/scheduler";
import { DAY_SHORT, PERIODS, type Assignment } from "@/lib/types";
import { Loading } from "./faculty";

export const Route = createFileRoute("/timetables/$id")({
  head: () => ({
    meta: [
      { title: "Timetable Viewer — Timetable OPT" },
      { name: "description", content: "Inspect a generated timetable by batch, faculty or room with metrics." },
      { property: "og:title", content: "Timetable Viewer — Timetable OPT" },
      { property: "og:description", content: "Inspect a generated timetable and its quality metrics." },
    ],
  }),
  component: TimetableDetail,
});

function TimetableDetail() {
  const { id } = Route.useParams();
  const { data: timetable, isLoading } = useQuery(timetableQuery(id));
  const [view, setView] = useState<"batch" | "faculty" | "room">("batch");
  const [filter, setFilter] = useState("all");

  const entries: Assignment[] = useMemo(() => timetable?.entries ?? [], [timetable]);

  const options = useMemo(() => {
    const key = view === "batch" ? "batchCode" : view === "faculty" ? "facultyCode" : "roomCode";
    return [...new Set(entries.map((e) => e[key] as string))].sort();
  }, [entries, view]);

  const filtered = useMemo(() => {
    if (filter === "all") return entries;
    const key = view === "batch" ? "batchCode" : view === "faculty" ? "facultyCode" : "roomCode";
    return entries.filter((e) => e[key] === filter);
  }, [entries, filter, view]);

  const exportCsv = () => {
    const rows = [
      ["Day", "Period", "Time", "Subject", "Code", "Batch", "Faculty", "Room"],
      ...filtered.map((e) => [
        DAY_SHORT[e.day] ?? "",
        `P${e.period + 1}`,
        PERIODS[e.period] ?? "",
        e.subjectName,
        e.subjectCode,
        e.batchCode,
        e.facultyName,
        e.roomCode,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `timetable-${id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) return <Loading />;
  if (!timetable)
    return (
      <div>
        <PageHead eyebrow="Optimization / 02" title="Timetable not found" />
        <Link to="/timetables" className="brutal-border inline-flex bg-ink px-4 py-2 font-mono text-xs text-paper uppercase">
          Back to archive
        </Link>
      </div>
    );

  const label = ALGORITHMS.find((a) => a.key === timetable.algorithm)?.label ?? timetable.algorithm;
  const metrics = timetable.metrics ?? { hardBreakdown: {}, softBreakdown: {}, convergence: [], facultyLoad: [], roomUsage: [], dayLoad: [] };

  return (
    <div>
      <PageHead
        eyebrow="Optimization / 02"
        title={label}
        description={timetable.name}
        actions={
          <>
            <Link
              to="/timetables"
              className="brutal-border inline-flex items-center gap-2 bg-card px-4 py-2.5 font-mono text-xs font-bold tracking-wider uppercase shadow-[3px_3px_0_0_var(--ink)]"
            >
              <ArrowLeft className="size-3" /> Archive
            </Link>
            <Btn variant="cobalt" onClick={exportCsv}>
              <Download className="size-3" /> Export CSV
            </Btn>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="Fitness score" value={timetable.fitness} unit="/100" tone="sun" />
        <Stat
          label="Hard conflicts"
          value={timetable.hard_conflicts}
          tone={timetable.hard_conflicts ? "signal" : "none"}
        />
        <Stat label="Soft penalty" value={timetable.soft_penalties} />
        <Stat label="Execution time" value={timetable.execution_ms} unit="ms" tone="cobalt" />
        <Stat
          label="Placed lessons"
          value={`${timetable.scheduled_count}/${timetable.required_count}`}
          hint={`${timetable.utilization}% room-slot use`}
        />
      </div>

      <div className="mt-6 space-y-6">
        <Panel
          title="Weekly grid"
          subtitle={`${filtered.length} sessions shown`}
          accent="cobalt"
          right={
            <div className="flex flex-wrap gap-2">
              <SelectInput
                className="w-32"
                value={view}
                onChange={(e) => {
                  setView(e.target.value as typeof view);
                  setFilter("all");
                }}
              >
                <option value="batch">By batch</option>
                <option value="faculty">By faculty</option>
                <option value="room">By room</option>
              </SelectInput>
              <SelectInput className="w-40" value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="all">All</option>
                {options.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </SelectInput>
            </div>
          }
        >
          <div className="p-4">
            <TimetableGrid entries={filtered} />
          </div>
        </Panel>

        <div className="grid gap-6 xl:grid-cols-2">
          <Panel title="Faculty workload" subtitle="Assigned hours vs weekly ceiling" accent="sun">
            <div className="p-4">
              <BarChartBlock
                data={metrics.facultyLoad as unknown as Record<string, unknown>[]}
                xKey="code"
                bars={[
                  { key: "hours", color: PALETTE.sun, name: "Assigned" },
                  { key: "max", color: PALETTE.cobalt, name: "Ceiling" },
                ]}
              />
            </div>
          </Panel>

          <Panel title="Room utilisation" subtitle="Occupied slots out of 35" accent="orchid">
            <div className="p-4">
              <ColoredBarBlock
                data={metrics.roomUsage as unknown as Record<string, unknown>[]}
                xKey="code"
                yKey="used"
                colors={[PALETTE.orchid, PALETTE.cobalt, PALETTE.sun, PALETTE.mint, PALETTE.signal]}
              />
            </div>
          </Panel>

          <Panel title="Daily distribution" subtitle="Sessions per weekday" accent="cobalt">
            <div className="p-4">
              <ColoredBarBlock
                data={metrics.dayLoad as unknown as Record<string, unknown>[]}
                xKey="day"
                yKey="classes"
                colors={[PALETTE.cobalt]}
              />
            </div>
          </Panel>

          <Panel title="Search convergence" subtitle="Fitness / completion over iterations" accent="signal">
            <div className="p-4">
              <LineChartBlock
                data={metrics.convergence as unknown as Record<string, unknown>[]}
                xKey="iteration"
                lines={[{ key: "fitness", color: PALETTE.signal, name: "Best so far" }]}
              />
            </div>
          </Panel>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Panel title="Hard constraint violations" accent="signal">
            <ul className="divide-y-2 divide-ink/10 font-mono text-xs">
              {Object.entries(metrics.hardBreakdown ?? {}).map(([k, v]) => (
                <li key={k} className="flex items-center justify-between px-4 py-2.5 uppercase">
                  <span>{k}</span>
                  <Tag tone={v ? "signal" : "mint"}>{v}</Tag>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Soft penalty breakdown" accent="orchid">
            <ul className="divide-y-2 divide-ink/10 font-mono text-xs">
              {Object.entries(metrics.softBreakdown ?? {}).map(([k, v]) => (
                <li key={k} className="flex items-center justify-between px-4 py-2.5 uppercase">
                  <span>{k}</span>
                  <Tag tone={v ? "orchid" : "mint"}>{Math.round(Number(v))}</Tag>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}
