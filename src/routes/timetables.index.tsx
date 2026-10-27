import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2, ArrowRight } from "lucide-react";
import { DataTable, Loading, PageHead, Panel, Tag } from "@/components/brutal";
import { deleteRow, timetablesQuery } from "@/lib/queries";
import { ALGORITHMS } from "@/lib/scheduler";

export const Route = createFileRoute("/timetables/")({
  head: () => ({
    meta: [
      { title: "Saved Timetables — Timetable OPT" },
      {
        name: "description",
        content: "Archive of generated timetables with fitness, conflicts and runtime.",
      },
      { property: "og:title", content: "Saved Timetables — Timetable OPT" },
      { property: "og:description", content: "Archive of generated timetables and their metrics." },
    ],
  }),
  component: TimetablesPage,
});

function TimetablesPage() {
  const { data: timetables = [], isLoading } = useQuery(timetablesQuery);
  const qc = useQueryClient();
  const remove = useMutation({
    mutationFn: (id: string) => deleteRow("timetables", id),
    onSuccess: () => {
      toast.success("Timetable deleted");
      qc.invalidateQueries({ queryKey: ["timetables"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHead
        eyebrow="Optimization / 02"
        title="Saved Timetables"
        description="Every saved run keeps its full schedule and metric payload for later comparison."
      />
      {isLoading ? (
        <Loading />
      ) : (
        <Panel title="Archive" subtitle={`${timetables.length} saved runs`} accent="sun">
          <DataTable head={["Name", "Algorithm", "Fitness", "Conflicts", "Placed", "Runtime", ""]}>
            {timetables.map((t) => (
              <tr key={t.id} className="border-b-2 border-ink/10 hover:bg-sun/20">
                <td className="px-3 py-2">{t.name}</td>
                <td className="px-3 py-2">
                  <Tag
                    tone={
                      t.algorithm === "genetic"
                        ? "orchid"
                        : t.algorithm === "greedy"
                          ? "sun"
                          : "cobalt"
                    }
                  >
                    {ALGORITHMS.find((a) => a.key === t.algorithm)?.label ?? t.algorithm}
                  </Tag>
                </td>
                <td className="px-3 py-2 font-bold">{t.fitness}</td>
                <td className="px-3 py-2">{t.hard_conflicts}</td>
                <td className="px-3 py-2">
                  {t.scheduled_count}/{t.required_count}
                </td>
                <td className="px-3 py-2">{t.execution_ms} ms</td>
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    <Link
                      to="/timetables/$id"
                      params={{ id: t.id }}
                      className="brutal-border bg-ink p-1.5 text-paper"
                      aria-label="Open"
                    >
                      <ArrowRight className="size-3" />
                    </Link>
                    <button
                      onClick={() => remove.mutate(t.id)}
                      className="brutal-border bg-card p-1.5 hover:bg-signal hover:text-paper"
                      aria-label="Delete"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {timetables.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center uppercase">
                  No saved timetables — run the generator first.
                </td>
              </tr>
            ) : null}
          </DataTable>
        </Panel>
      )}
    </div>
  );
}
