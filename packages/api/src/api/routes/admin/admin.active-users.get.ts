import { and, gte, lt, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { userTable } from "@/db/schema";
import { SuccessResponse } from "@/api/schemas/common.schema";

// DAU + MAU snapshot for the admin overview header, plus MAU
// comparisons against the prior 30-day and prior-6-month windows so
// the admin can see whether engagement is trending up or down. All
// counts are derived from `user.last_seen_at` which
// `/api/protected/user/me` bumps (throttled to once per 5 minutes per
// user, fire-and-forget). One query, parallel aggregates.
const DAY_MS = 24 * 60 * 60 * 1000;

export const adminActiveUsersGetRoute = new Elysia().get(
  "/active-users",
  async () => {
    const now = Date.now();
    const dayAgo = new Date(now - DAY_MS);
    const monthAgo = new Date(now - 30 * DAY_MS);
    // Prior month: days -60..-30 (i.e. the 30-day window ending 30
    // days ago). Used for `% vs last month` on MAU.
    const twoMonthsAgo = new Date(now - 60 * DAY_MS);
    // Prior 6-month-old window: 30-day window ending 180 days ago.
    // Used for `% vs last 6 months` on MAU — it's a 30-day baseline
    // sampled 6 months back so the comparison is apples-to-apples.
    const sixMonthsAgo = new Date(now - 180 * DAY_MS);
    const sixMonthsAndOneAgo = new Date(now - 210 * DAY_MS);

    const [row] = await db
      .select({
        dau: sql<number>`COUNT(*) FILTER (WHERE ${gte(
          userTable.lastSeenAt,
          dayAgo,
        )})::int`,
        mau: sql<number>`COUNT(*) FILTER (WHERE ${gte(
          userTable.lastSeenAt,
          monthAgo,
        )})::int`,
        mauPrevMonth: sql<number>`COUNT(*) FILTER (WHERE ${and(
          gte(userTable.lastSeenAt, twoMonthsAgo),
          lt(userTable.lastSeenAt, monthAgo),
        )})::int`,
        mauSixMonthsAgo: sql<number>`COUNT(*) FILTER (WHERE ${and(
          gte(userTable.lastSeenAt, sixMonthsAndOneAgo),
          lt(userTable.lastSeenAt, sixMonthsAgo),
        )})::int`,
      })
      .from(userTable);

    return {
      success: true as const,
      message: {
        dau: row?.dau ?? 0,
        mau: row?.mau ?? 0,
        mauPrevMonth: row?.mauPrevMonth ?? 0,
        mauSixMonthsAgo: row?.mauSixMonthsAgo ?? 0,
      },
    };
  },
  {
    response: SuccessResponse(
      t.Object({
        dau: t.Integer(),
        mau: t.Integer(),
        // 30-day active count over the 30-day window ending one month
        // ago. `vs last month` delta = (mau − mauPrevMonth) / mauPrevMonth.
        mauPrevMonth: t.Integer(),
        // 30-day active count over the 30-day window ending six months
        // ago. `vs last 6 months` delta = (mau − mauSixMonthsAgo) /
        // mauSixMonthsAgo.
        mauSixMonthsAgo: t.Integer(),
      }),
    ),
  },
);
