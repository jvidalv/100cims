"use client";

import { parseAsStringLiteral, useQueryState } from "nuqs";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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
  useAdminStatsTimeseries,
} from "@/domains/admin/api";

const RANGES: { value: StatsRange; label: string }[] = [
  { value: "week", label: "Last week" },
  { value: "month", label: "Last month" },
  { value: "6months", label: "Last 6 months" },
  { value: "year", label: "Last year" },
  { value: "all", label: "All time" },
];

const RANGE_VALUES = RANGES.map((r) => r.value);

const METRIC_COLORS: Record<StatsMetric, string> = {
  "new-users": "hsl(var(--chart-1))",
  summits: "hsl(var(--chart-2))",
  plans: "hsl(var(--chart-3))",
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
        <Select value={range} onValueChange={(v) => setRange(v as StatsRange)}>
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

  const total = data?.points.reduce((sum, p) => sum + p.count, 0) ?? 0;

  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
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
        <div className="h-64">
          {data.points.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-muted-foreground text-sm">
                No data for this range.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data.points}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
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
