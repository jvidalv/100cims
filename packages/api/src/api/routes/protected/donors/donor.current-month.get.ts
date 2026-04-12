import { sql } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { donorTable } from "@/db/schema";

export const donorCurrentMonthGetRoute = new Elysia().get(
  "/current-month",
  async () => {
    const startOfMonth = sql`date_trunc('month', CURRENT_DATE)`;
    const totalDonation = await db
      .select({
        total: sql<string>`COALESCE(SUM(${donorTable.donation}), 0)`.as(
          "total",
        ),
      })
      .from(donorTable)
      .where(sql`${donorTable.createdAt} >= ${startOfMonth}`)
      .then((res) => res[0]?.total || "0");

    return {
      success: true,
      message: { totalDonation },
    };
  },
  {
    response: t.Object({
      success: t.Boolean(),
      message: t.Object({
        totalDonation: t.String(),
      }),
    }),
  },
);
