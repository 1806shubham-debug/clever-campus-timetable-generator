import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHead, Panel, Tag, TextInput } from "@/components/brutal";
import { constraintsQuery, updateRow } from "@/lib/queries";
import { Loading } from "./faculty";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/constraints")({
  head: () => ({
    meta: [
      { title: "Constraint Model — Timetable OPT" },
      {
        name: "description",
        content: "Hard and soft scheduling constraints with tunable weights used by the fitness function.",
      },
      { property: "og:title", content: "Constraint Model — Timetable OPT" },
      { property: "og:description", content: "Hard and soft constraints with tunable fitness weights." },
    ],
  }),
  component: ConstraintsPage,
});

function ConstraintsPage() {
  const { data: constraints = [], isLoading } = useQuery(constraintsQuery);
  const qc = useQueryClient();

  const mutate = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Record<string, unknown> }) =>
      updateRow("constraints", id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["constraints"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const hard = constraints.filter((c) => c.constraint_type === "Hard");
  const soft = constraints.filter((c) => c.constraint_type !== "Hard");

  return (
    <div>
      <PageHead
        eyebrow="Master Data / 05"
        title="Constraint Model"
        description="Hard constraints must never be violated. Soft constraints carry weights that shape the fitness score."
      />
      {isLoading ? (
        <Loading />
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <Group
            title="Hard constraints"
            subtitle="Violations invalidate a timetable"
            accent="signal"
            items={hard}
            onToggle={(id, enabled) => mutate.mutate({ id, patch: { enabled } })}
            onWeight={(id, weight) => mutate.mutate({ id, patch: { weight } })}
          />
          <Group
            title="Soft constraints"
            subtitle="Weighted penalties in the objective function"
            accent="orchid"
            items={soft}
            onToggle={(id, enabled) => mutate.mutate({ id, patch: { enabled } })}
            onWeight={(id, weight) => mutate.mutate({ id, patch: { weight } })}
          />
        </div>
      )}
    </div>
  );
}

function Group({
  title,
  subtitle,
  accent,
  items,
  onToggle,
  onWeight,
}: {
  title: string;
  subtitle: string;
  accent: "signal" | "orchid";
  items: { id: string; name: string; code: string; weight: number; enabled: boolean; description: string | null }[];
  onToggle: (id: string, enabled: boolean) => void;
  onWeight: (id: string, weight: number) => void;
}) {
  return (
    <Panel title={title} subtitle={subtitle} accent={accent}>
      <ul className="divide-y-2 divide-ink/10">
        {items.map((c) => (
          <li key={c.id} className="flex flex-wrap items-start gap-4 p-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-mono text-xs font-bold uppercase">{c.name}</p>
                <Tag tone="ink">{c.code}</Tag>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{c.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <label className="font-mono text-[10px] uppercase">Weight</label>
              <TextInput
                type="number"
                className="w-20"
                defaultValue={c.weight}
                onBlur={(e) => onWeight(c.id, Number(e.target.value) || 0)}
              />
              <button
                onClick={() => onToggle(c.id, !c.enabled)}
                className={cn(
                  "brutal-border px-3 py-2 font-mono text-[10px] font-bold uppercase",
                  c.enabled ? "bg-mint" : "bg-card text-muted-foreground",
                )}
              >
                {c.enabled ? "On" : "Off"}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
