import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  DoorClosed,
  GraduationCap,
  SlidersHorizontal,
  Cpu,
  CalendarRange,
  BarChart3,
  FlaskConical,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, group: "Overview" },
  { to: "/faculty", label: "Faculty", icon: Users, group: "Master Data" },
  { to: "/subjects", label: "Subjects", icon: BookOpen, group: "Master Data" },
  { to: "/rooms", label: "Rooms", icon: DoorClosed, group: "Master Data" },
  { to: "/batches", label: "Batches", icon: GraduationCap, group: "Master Data" },
  { to: "/constraints", label: "Constraints", icon: SlidersHorizontal, group: "Master Data" },
  { to: "/generate", label: "Generator", icon: Cpu, group: "Optimization" },
  { to: "/timetables", label: "Timetables", icon: CalendarRange, group: "Optimization" },
  { to: "/analysis", label: "Algorithm Analysis", icon: BarChart3, group: "Research" },
  { to: "/research", label: "Research Report", icon: FlaskConical, group: "Research" },
] as const;

const GROUPS = ["Overview", "Master Data", "Optimization", "Research"];

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-col gap-6 p-4">
      {GROUPS.map((group) => (
        <div key={group}>
          <p className="mb-2 font-mono text-[10px] font-bold tracking-[0.25em] text-paper/50 uppercase">
            {group}
          </p>
          <ul className="space-y-1">
            {NAV.filter((n) => n.group === group).map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  onClick={() => setOpen(false)}
                  activeOptions={{ exact: item.to === "/" }}
                  className="flex items-center gap-3 border-2 border-transparent px-3 py-2 font-mono text-[11px] font-bold tracking-wider text-paper/80 uppercase hover:border-paper hover:bg-paper/10"
                  activeProps={{ className: "!bg-sun !text-ink !border-ink" }}
                >
                  <item.icon className="size-4 shrink-0" strokeWidth={2.5} />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto border-r-2 border-ink bg-ink lg:flex">
          <BrandBlock />
          {nav}
          <div className="mt-auto border-t-2 border-paper/20 p-4">
            <p className="font-mono text-[9px] leading-relaxed tracking-wider text-paper/50 uppercase">
              Research build v1.0 · Greedy / CSP / GA comparative scheduler
            </p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b-2 border-ink bg-background px-4 py-3 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="brutal-border grid size-8 place-items-center bg-sun font-display text-sm">
                T
              </div>
              <span className="font-display text-sm uppercase">Timetable OPT</span>
            </div>
            <button
              onClick={() => setOpen((v) => !v)}
              className="brutal-border bg-ink p-2 text-paper"
              aria-label="Toggle navigation"
            >
              {open ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </header>

          {open ? <div className="border-b-2 border-ink bg-ink lg:hidden">{nav}</div> : null}

          <main className={cn("grid-paper min-w-0 flex-1 p-4 md:p-8")}>{children}</main>
        </div>
      </div>
    </div>
  );
}

function BrandBlock() {
  return (
    <div className="border-b-2 border-paper/20 p-4">
      <div className="flex items-center gap-3">
        <div className="brutal-border grid size-10 shrink-0 place-items-center bg-sun font-display text-lg text-ink">
          T
        </div>
        <div>
          <p className="font-display text-sm leading-none text-paper uppercase">Timetable OPT</p>
          <p className="mt-1 font-mono text-[9px] tracking-[0.2em] text-paper/50 uppercase">
            College Scheduling Lab
          </p>
        </div>
      </div>
    </div>
  );
}
