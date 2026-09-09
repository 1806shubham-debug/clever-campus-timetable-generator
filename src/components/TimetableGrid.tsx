import { DAY_SHORT, PERIODS, type Assignment } from "@/lib/types";
import { cn } from "@/lib/utils";

const TYPE_BG: Record<string, string> = {
  Theory: "bg-card",
  Lab: "bg-cobalt text-paper",
  Tutorial: "bg-orchid text-paper",
};

export function TimetableGrid({
  entries,
  clashKeys = new Set<string>(),
}: {
  entries: Assignment[];
  clashKeys?: Set<string>;
}) {
  const cell = (day: number, period: number) =>
    entries.filter((e) => e.day === day && e.period === period);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] border-collapse">
        <thead>
          <tr>
            <th className="brutal-border bg-ink px-2 py-2 font-mono text-[10px] tracking-widest text-paper uppercase">
              Slot
            </th>
            {DAY_SHORT.map((d) => (
              <th
                key={d}
                className="brutal-border bg-ink px-2 py-2 font-mono text-[10px] tracking-widest text-paper uppercase"
              >
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PERIODS.map((time, period) => (
            <tr key={time}>
              <th className="brutal-border bg-sun px-2 py-2 text-left font-mono text-[10px] font-bold whitespace-nowrap">
                P{period + 1}
                <span className="block font-normal opacity-70">{time}</span>
              </th>
              {DAY_SHORT.map((_, day) => {
                const items = cell(day, period);
                return (
                  <td key={day} className="brutal-border bg-background p-1 align-top">
                    <div className="space-y-1">
                      {items.map((e, i) => {
                        const clash = clashKeys.has(`${e.batchId}:${day}:${period}`);
                        return (
                          <div
                            key={`${e.subjectId}-${i}`}
                            className={cn(
                              "border-2 border-ink px-2 py-1.5 font-mono text-[10px] leading-tight",
                              TYPE_BG[e.subjectType] ?? "bg-card",
                              clash && "bg-signal text-paper",
                            )}
                          >
                            <p className="font-bold tracking-wide uppercase">{e.subjectCode}</p>
                            <p className="truncate opacity-80">{e.batchCode}</p>
                            <p className="truncate opacity-70">
                              {e.facultyCode} · {e.roomCode}
                            </p>
                          </div>
                        );
                      })}
                      {items.length === 0 ? (
                        <div className="px-2 py-3 text-center font-mono text-[10px] text-muted-foreground">
                          —
                        </div>
                      ) : null}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
