import type { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Panel({
  title,
  subtitle,
  right,
  children,
  className,
  accent,
}: {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  children?: ReactNode;
  className?: string;
  accent?: "sun" | "cobalt" | "signal" | "orchid" | "none";
}) {
  const accentBar =
    accent === "sun"
      ? "bg-sun"
      : accent === "cobalt"
        ? "bg-cobalt"
        : accent === "signal"
          ? "bg-signal"
          : accent === "orchid"
            ? "bg-orchid"
            : "";
  return (
    <section className={cn("brutal-border brutal-shadow bg-card", className)}>
      {accent && accent !== "none" ? <div className={cn("h-2 border-b-2 border-ink", accentBar)} /> : null}
      {title ? (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink px-4 py-3">
          <div>
            <h2 className="text-sm leading-none font-bold tracking-tight md:text-base">{title}</h2>
            {subtitle ? (
              <p className="mt-1 font-mono text-[11px] tracking-tight text-muted-foreground uppercase">
                {subtitle}
              </p>
            ) : null}
          </div>
          {right}
        </header>
      ) : null}
      {children}
    </section>
  );
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "solid" | "sun" | "cobalt" | "signal" | "orchid" | "ghost";
  size?: "sm" | "md";
};

export function Btn({ variant = "solid", size = "md", className, ...props }: BtnProps) {
  const variants: Record<string, string> = {
    solid: "bg-ink text-paper hover:bg-ink/90",
    sun: "bg-sun text-ink",
    cobalt: "bg-cobalt text-paper",
    signal: "bg-signal text-paper",
    orchid: "bg-orchid text-paper",
    ghost: "bg-card text-ink",
  };
  return (
    <button
      {...props}
      className={cn(
        "brutal-border inline-flex items-center justify-center gap-2 font-mono font-bold tracking-wider uppercase transition-transform",
        "shadow-[3px_3px_0_0_var(--ink)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-0 disabled:active:shadow-[3px_3px_0_0_var(--ink)]",
        size === "sm" ? "px-2.5 py-1.5 text-[11px]" : "px-4 py-2.5 text-xs",
        variants[variant],
        className,
      )}
    />
  );
}

export function Tag({
  children,
  tone = "ink",
  className,
}: {
  children: ReactNode;
  tone?: "ink" | "sun" | "cobalt" | "signal" | "orchid" | "mint";
  className?: string;
}) {
  const tones: Record<string, string> = {
    ink: "bg-ink text-paper",
    sun: "bg-sun text-ink",
    cobalt: "bg-cobalt text-paper",
    signal: "bg-signal text-paper",
    orchid: "bg-orchid text-paper",
    mint: "bg-mint text-ink",
  };
  return (
    <span
      className={cn(
        "brutal-border inline-flex items-center px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider uppercase",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Stat({
  label,
  value,
  unit,
  hint,
  tone = "none",
}: {
  label: string;
  value: string | number;
  unit?: string;
  hint?: string;
  tone?: "none" | "sun" | "cobalt" | "signal" | "orchid";
}) {
  const bg =
    tone === "sun"
      ? "bg-sun"
      : tone === "cobalt"
        ? "bg-cobalt text-paper"
        : tone === "signal"
          ? "bg-signal text-paper"
          : tone === "orchid"
            ? "bg-orchid text-paper"
            : "bg-card";
  return (
    <div className={cn("brutal-border brutal-shadow p-4", bg)}>
      <p className="font-mono text-[10px] font-bold tracking-[0.15em] uppercase opacity-70">{label}</p>
      <p className="mt-2 font-display text-3xl leading-none">
        {value}
        {unit ? <span className="ml-1 font-mono text-sm">{unit}</span> : null}
      </p>
      {hint ? <p className="mt-2 font-mono text-[10px] uppercase opacity-70">{hint}</p> : null}
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] font-bold tracking-[0.15em] uppercase">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "brutal-border w-full bg-background px-3 py-2 font-mono text-xs outline-none focus:bg-sun/30",
        props.className,
      )}
    />
  );
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "brutal-border w-full bg-background px-3 py-2 font-mono text-xs outline-none focus:bg-sun/30",
        props.className,
      )}
    />
  );
}

export function PageHead({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b-2 border-ink pb-4">
      <div>
        <p className="font-mono text-[10px] font-bold tracking-[0.3em] uppercase">{eyebrow}</p>
        <h1 className="mt-2 text-2xl leading-none md:text-4xl">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function DataTable({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="bg-ink text-paper">
            {head.map((h) => (
              <th
                key={h}
                className="border-r-2 border-paper/20 px-3 py-2 font-mono text-[10px] font-bold tracking-[0.12em] whitespace-nowrap uppercase last:border-r-0"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="font-mono text-xs">{children}</tbody>
      </table>
    </div>
  );
}
