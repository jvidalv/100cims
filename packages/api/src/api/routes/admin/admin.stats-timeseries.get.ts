import { gte, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { summitTable, userTable } from "@/db/schema";
import { AdminStatsTimeseriesResponseSchema } from "@/api/schemas/admin.schema";
import { SuccessResponse } from "@/api/schemas/common.schema";

const RANGES = ["week", "month", "6months", "year", "all"] as const;
type Range = (typeof RANGES)[number];

const METRICS = ["new-users", "summits"] as const;
type Metric = (typeof METRICS)[number];

const BUCKET_BY_RANGE: Record<Range, "day" | "week" | "month"> = {
  week: "day",
  month: "day",
  "6months": "week",
  year: "week",
  all: "month",
};

const sinceForRange = (range: Range): Date | null => {
  const now = new Date();
  switch (range) {
    case "week":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "month":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "6months":
      return new Date(now.getTime() - 182 * 24 * 60 * 60 * 1000);
    case "year":
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    case "all":
      return null;
  }
};

export const adminStatsTimeseriesGetRoute = new Elysia().get(
  "/stats/timeseries",
  async ({ query }) => {
    const metric = query.metric as Metric;
    const range = query.range as Range;
    const bucket = BUCKET_BY_RANGE[range];
    const since = sinceForRange(range);

    const table = metric === "new-users" ? userTable : summitTable;
    const dateCol =
      metric === "new-users" ? userTable.createdAt : summitTable.createdAt;

    const bucketExpr = sql<string>`to_char(date_trunc(${sql.raw(`'${bucket}'`)}, ${dateCol}), 'YYYY-MM-DD')`;

    const rows = await db
      .select({
        date: bucketExpr,
        count: sql<number>`count(*)::int`,
      })
      .from(table)
      .where(since ? gte(dateCol, since) : undefined)
      .groupBy(bucketExpr)
      .orderBy(bucketExpr);

    return {
      success: true,
      message: { bucket, points: rows },
    };
  },
  {
    query: t.Object({
      metric: t.Union(METRICS.map((m) => t.Literal(m))),
      range: t.Union(RANGES.map((r) => t.Literal(r))),
    }),
    response: SuccessResponse(AdminStatsTimeseriesResponseSchema),
  },
);
