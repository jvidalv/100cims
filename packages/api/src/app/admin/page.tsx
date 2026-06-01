"use client";

import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { RELEASES } from "@/api/lib/releases";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type StatsMetric,
  type StatsRange,
  useAdminActiveUsers,
  useAdminStatsTimeseries,
} from "@/domains/admin/api";
import { toDateInputValue } from "@/lib/format-date";

const RANGES: { value: StatsRange; label: string }[] = [
  { value: "week", label: "Last week" },
  { value: "month", label: "Last month" },
  { value: "6months", label: "Last 6 months" },
  { value: "year", label: "Last year" },
  { value: "all", label: "All time" },
];

const RANGE_VALUES = RANGES.map((r) => r.value);
const RANGE_VALUE_SET = new Set<string>(RANGE_VALUES);

const isStatsRange = (v: string): v is StatsRange => RANGE_VALUE_SET.has(v);

const METRIC_COLORS: Record<StatsMetric, string> = {
  "new-users": "hsl(var(--chart-1))",
  summits: "hsl(var(--chart-2))",
  plans: "hsl(var(--chart-3))",
};

interface ChartPoint {
  date: string;
  count: number;
}

interface Marker {
  x: string;
  versions: string[];
}

const markersForPoints = (dates: string[]): Marker[] => {
  if (dates.length === 0) return [];
  const first = dates[0];
  const last = dates[dates.length - 1];
  const visible = RELEASES.filter(
    (r) => r.releasedAt >= first && r.releasedAt <= last,
  );
  const byBucket = new Map<string, string[]>();
  for (const r of visible) {
    let snapped = dates[0];
    for (const d of dates) {
      if (d <= r.releasedAt) snapped = d;
      else break;
    }
    const arr = byBucket.get(snapped) ?? [];
    arr.push(r.version);
    byBucket.set(snapped, arr);
  }
  return [...byBucket.entries()].map(([x, versions]) => ({ x, versions }));
};

export default function AdminPage() {
  const [range, setRange] = useQueryState(
    "range",
    parseAsStringLiteral(RANGE_VALUES).withDefault("month"),
  );

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Overview</h1>
        <Select
          value={range}
          onValueChange={(v) => {
            if (isStatsRange(v)) void setRange(v);
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RANGES.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-8">
        <ActiveUsersCards />
        <ChartCard title="New users" metric="new-users" range={range} />
        <ChartCard title="Summits" metric="summits" range={range} />
        <ChartCard title="Plans created" metric="plans" range={range} />
      </div>
    </div>
  );
}

function ChartCard({
  title,
  metric,
  range,
}: {
  title: string;
  metric: StatsMetric;
  range: StatsRange;
}) {
  const color = METRIC_COLORS[metric];
  const { data, error, isLoading } = useAdminStatsTimeseries(metric, range);

  const points: ChartPoint[] = useMemo(
    () =>
      data?.points.map((p) => ({
        date: toDateInputValue(p.date),
        count: p.count,
      })) ?? [],
    [data],
  );
  const total = points.reduce((sum, p) => sum + p.count, 0);
  const markers = useMemo(
    () => markersForPoints(points.map((p) => p.date)),
    [points],
  );

  return (
    <div className="rounded border bg-card p-6 space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </h2>
        {data && (
          <span className="text-2xl font-bold tabular-nums">{total}</span>
        )}
      </div>

      {error && <p className="text-red-600 text-sm">{error.message}</p>}
      {isLoading && !data && (
        <div className="h-64 flex items-center justify-center">
          <p className="text-muted-foreground text-sm">Loading…</p>
        </div>
      )}

      {data && (
        <div className="h-64 w-full min-w-0">
          {points.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-muted-foreground text-sm">
                No data for this range.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={256}>
              <LineChart
                data={points}
                margin={{ top: 16, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => formatTick(d, data.bucket)}
                  className="text-xs"
                  tick={{ fill: "currentColor" }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={32}
                />
                <YAxis
                  allowDecimals={false}
                  className="text-xs"
                  tick={{ fill: "currentColor" }}
                  tickLine={false}
                  axisLine={false}
                  width={48}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                  labelFormatter={(d) => formatTick(String(d), data.bucket)}
                />
                {markers.map((m) => (
                  <ReferenceLine
                    key={m.x}
                    x={m.x}
                    stroke="hsl(var(--muted-foreground))"
                    strokeDasharray="2 3"
                    strokeOpacity={0.7}
                    ifOverflow="extendDomain"
                    label={{
                      value: m.versions.map((v) => `v${v}`).join(", "),
                      position: "top",
                      fontSize: 10,
                      fill: "hsl(var(--muted-foreground))",
                    }}
                  />
                ))}
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      )}
    </div>
  );
}

function ActiveUsersCards() {
  const { data, error, isLoading } = useAdminActiveUsers();

  return (
    <div className="grid grid-cols-2 gap-4">
      <MetricCard
        label="DAU"
        sublabel="Active in the last 24 hours"
        value={data?.dau}
        loading={isLoading && !data}
        error={error?.message}
      />
      <MetricCard
        label="MAU"
        sublabel="Active in the last 30 days"
        value={data?.mau}
        loading={isLoading && !data}
        error={error?.message}
        deltas={
          data
            ? [
                {
                  label: "vs last month",
                  current: data.mau,
                  baseline: data.mauPrevMonth,
                },
                {
                  label: "vs 6 months ago",
                  current: data.mau,
                  baseline: data.mauSixMonthsAgo,
                },
              ]
            : undefined
        }
      />
    </div>
  );
}

type Delta = { label: string; current: number; baseline: number };

function MetricCard({
  label,
  sublabel,
  value,
  loading,
  error,
  deltas,
}: {
  label: string;
  sublabel: string;
  value: number | undefined;
  loading: boolean;
  error: string | undefined;
  deltas?: Delta[];
}) {
  return (
    <div className="rounded border bg-card p-6 space-y-2">
      <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      {error ? (
        <p className="text-red-600 text-sm">{error}</p>
      ) : loading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : (
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <p className="text-4xl font-bold tabular-nums">{value ?? 0}</p>
          {deltas && deltas.length > 0 && (
            <div className="flex flex-col gap-0.5">
              {deltas.map((d) => (
                <DeltaPill key={d.label} delta={d} />
              ))}
            </div>
          )}
        </div>
      )}
      <p className="text-xs text-muted-foreground">{sublabel}</p>
    </div>
  );
}

function DeltaPill({ delta }: { delta: Delta }) {
  // Baseline of 0 makes the percentage undefined — show "—" rather
  // than `∞%` or `NaN%`. Otherwise render with a +/- sign and color
  // the value emerald (up) or red (down). Equal counts → neutral.
  if (delta.baseline === 0) {
    return (
      <p className="text-xs text-muted-foreground tabular-nums">
        — <span className="text-muted-foreground/70">{delta.label}</span>
      </p>
    );
  }
  const ratio = (delta.current - delta.baseline) / delta.baseline;
  const pct = Math.round(ratio * 100);
  const sign = pct > 0 ? "+" : "";
  const cls =
    pct > 0
      ? "text-emerald-600 dark:text-emerald-400"
      : pct < 0
        ? "text-red-600 dark:text-red-400"
        : "text-muted-foreground";
  return (
    <p className="text-xs tabular-nums">
      <span className={`font-semibold ${cls}`}>
        {sign}
        {pct}%
      </span>{" "}
      <span className="text-muted-foreground/70">{delta.label}</span>
    </p>
  );
}

function formatTick(date: string, bucket: "day" | "week" | "month"): string {
  const d = new Date(date);
  if (bucket === "month") {
    return d.toLocaleDateString(undefined, {
      month: "short",
      year: "2-digit",
    });
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
