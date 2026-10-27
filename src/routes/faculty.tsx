import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { CrudManager } from "@/components/CrudManager";
import { Btn, Loading, PageHead, Panel, SelectInput, Tag } from "@/components/brutal";
import { facultyQuery, updateRow } from "@/lib/queries";
import { DAY_SHORT, PERIODS } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/faculty")({
  head: () => ({
    meta: [
      { title: "Faculty Registry — Timetable OPT" },
      {
        name: "description",
        content: "Manage faculty members, teaching loads and weekly availability.",
      },
      { property: "og:title", content: "Faculty Registry — Timetable OPT" },
      {
        property: "og:description",
        content: "Manage faculty members, loads and weekly availability.",
      },
    ],
  }),
  component: FacultyPage,
});

const DEPTS = ["CSE", "IT", "ECE", "EEE", "MECH", "CIVIL"];
const DESIGNATIONS = [
  "Professor",
  "Associate Professor",
  "Assistant Professor",
  "Visiting Faculty",
];

function FacultyPage() {
  const { data: faculty = [], isLoading } = useQuery(facultyQuery);

  return (
    <div>
      <PageHead
        eyebrow="Master Data / 01"
        title="Faculty Registry"
        description="Teaching staff, weekly load ceilings and hard availability blocks used by every optimizer run."
      />
      {isLoading ? (
        <Loading />
      ) : (
        <div className="space-y-6">
          <CrudManager
            table="faculty"
            queryKeys={[["faculty"]]}
            formTitle="Faculty record"
            accent="sun"
            rows={faculty as never}
            fields={[
              { key: "name", label: "Full name", type: "text", required: true },
              { key: "code", label: "Code", type: "text", required: true },
              {
                key: "department",
                label: "Department",
                type: "select",
                options: DEPTS.map((d) => ({ value: d, label: d })),
                default: "CSE",
              },
              {
                key: "designation",
                label: "Designation",
                type: "select",
                options: DESIGNATIONS.map((d) => ({ value: d, label: d })),
                default: "Assistant Professor",
              },
              { key: "email", label: "Email", type: "text" },
              { key: "max_hours_per_week", label: "Max hours / week", type: "number", default: 18 },
            ]}
            head={["Code", "Name", "Dept", "Designation", "Max load", "Blocked slots"]}
            renderRow={(row) => (
              <>
                <td className="px-3 py-2 font-bold">{String(row["code"])}</td>
                <td className="px-3 py-2">{String(row["name"])}</td>
                <td className="px-3 py-2">
                  <Tag tone="cobalt">{String(row["department"])}</Tag>
                </td>
                <td className="px-3 py-2">{String(row["designation"])}</td>
                <td className="px-3 py-2">{String(row["max_hours_per_week"])} h</td>
                <td className="px-3 py-2">
                  {(row["unavailable_slots"] as string[] | undefined)?.length ?? 0}
                </td>
              </>
            )}
          />
          <AvailabilityEditor />
        </div>
      )}
    </div>
  );
}

function AvailabilityEditor() {
  const { data: faculty = [] } = useQuery(facultyQuery);
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string>("");
  const active = faculty.find((f) => f.id === selected) ?? faculty[0];
  const blocked = new Set(active?.unavailable_slots ?? []);

  const save = useMutation({
    mutationFn: (slots: string[]) => updateRow("faculty", active!.id, { unavailable_slots: slots }),
    onSuccess: () => {
      toast.success("Availability updated");
      qc.invalidateQueries({ queryKey: ["faculty"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!active) return null;

  const toggle = (day: number, period: number) => {
    const key = `${day}-${period}`;
    const next = new Set(blocked);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    save.mutate([...next]);
  };

  return (
    <Panel
      title="Availability matrix"
      subtitle="Click a cell to block / unblock a slot (hard constraint)"
      accent="signal"
      right={
        <div className="w-56">
          <SelectInput value={active.id} onChange={(e) => setSelected(e.target.value)}>
            {faculty.map((f) => (
              <option key={f.id} value={f.id}>
                {f.code} · {f.name}
              </option>
            ))}
          </SelectInput>
        </div>
      }
    >
      <div className="overflow-x-auto p-4">
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr>
              <th className="brutal-border bg-ink px-2 py-1.5 font-mono text-[10px] text-paper uppercase">
                Slot
              </th>
              {DAY_SHORT.map((d) => (
                <th
                  key={d}
                  className="brutal-border bg-ink px-2 py-1.5 font-mono text-[10px] text-paper uppercase"
                >
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERIODS.map((t, period) => (
              <tr key={t}>
                <th className="brutal-border bg-secondary px-2 py-1.5 text-left font-mono text-[10px] whitespace-nowrap">
                  P{period + 1} <span className="opacity-60">{t}</span>
                </th>
                {DAY_SHORT.map((_, day) => {
                  const isBlocked = blocked.has(`${day}-${period}`);
                  return (
                    <td key={day} className="brutal-border p-0">
                      <button
                        onClick={() => toggle(day, period)}
                        className={cn(
                          "h-9 w-full font-mono text-[10px] font-bold uppercase",
                          isBlocked ? "bg-signal text-paper" : "bg-card hover:bg-sun/50",
                        )}
                      >
                        {isBlocked ? "Blocked" : "Free"}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Tag tone="signal">Blocked = optimizer must not place a class</Tag>
          <Btn size="sm" variant="ghost" onClick={() => save.mutate([])}>
            Clear all blocks
          </Btn>
        </div>
      </div>
    </Panel>
  );
}
