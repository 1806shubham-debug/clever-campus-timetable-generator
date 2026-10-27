import { useEffect, useState, type ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function ClientOnly({ children, height }: { children: ReactNode; height: number }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div style={{ height }} className="animate-pulse bg-secondary" />;
  return <>{children}</>;
}

const axis = {
  stroke: "#000",
  tick: { fontFamily: "IBM Plex Mono, monospace", fontSize: 10, fill: "#000" },
};

const tooltipStyle = {
  border: "2px solid #000",
  borderRadius: 0,
  fontFamily: "IBM Plex Mono, monospace",
  fontSize: 11,
  textTransform: "uppercase" as const,
  background: "#fff",
};

export function BarChartBlock({
  data,
  xKey,
  bars,
  height = 260,
}: {
  data: Record<string, unknown>[];
  xKey: string;
  bars: { key: string; color: string; name?: string }[];
  height?: number;
}) {
  return (
    <ClientOnly height={height}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid stroke="#00000018" vertical={false} />
          <XAxis dataKey={xKey} {...axis} />
          <YAxis {...axis} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#00000010" }} />
          {bars.length > 1 ? (
            <Legend
              wrapperStyle={{
                fontFamily: "IBM Plex Mono",
                fontSize: 10,
                textTransform: "uppercase",
              }}
            />
          ) : null}
          {bars.map((b) => (
            <Bar
              key={b.key}
              dataKey={b.key}
              name={b.name ?? b.key}
              fill={b.color}
              stroke="#000"
              strokeWidth={2}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ClientOnly>
  );
}

export function ColoredBarBlock({
  data,
  xKey,
  yKey,
  colors,
  height = 260,
}: {
  data: Record<string, unknown>[];
  xKey: string;
  yKey: string;
  colors: string[];
  height?: number;
}) {
  return (
    <ClientOnly height={height}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid stroke="#00000018" vertical={false} />
          <XAxis dataKey={xKey} {...axis} />
          <YAxis {...axis} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#00000010" }} />
          <Bar dataKey={yKey} stroke="#000" strokeWidth={2}>
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ClientOnly>
  );
}

export function LineChartBlock({
  data,
  xKey,
  lines,
  height = 260,
}: {
  data: Record<string, unknown>[];
  xKey: string;
  lines: { key: string; color: string; name?: string }[];
  height?: number;
}) {
  return (
    <ClientOnly height={height}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid stroke="#00000018" />
          <XAxis dataKey={xKey} {...axis} />
          <YAxis {...axis} domain={[0, 100]} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend
            wrapperStyle={{ fontFamily: "IBM Plex Mono", fontSize: 10, textTransform: "uppercase" }}
          />
          {lines.map((l) => (
            <Line
              key={l.key}
              type="monotone"
              dataKey={l.key}
              name={l.name ?? l.key}
              stroke={l.color}
              strokeWidth={3}
              dot={false}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ClientOnly>
  );
}

export function RadarBlock({
  data,
  series,
  height = 300,
}: {
  data: Record<string, unknown>[];
  series: { key: string; color: string }[];
  height?: number;
}) {
  return (
    <ClientOnly height={height}>
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="#00000030" />
          <PolarAngleAxis
            dataKey="metric"
            tick={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 10, fill: "#000" }}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend
            wrapperStyle={{ fontFamily: "IBM Plex Mono", fontSize: 10, textTransform: "uppercase" }}
          />
          {series.map((s) => (
            <Radar
              key={s.key}
              dataKey={s.key}
              stroke="#000"
              strokeWidth={2}
              fill={s.color}
              fillOpacity={0.45}
            />
          ))}
        </RadarChart>
      </ResponsiveContainer>
    </ClientOnly>
  );
}
