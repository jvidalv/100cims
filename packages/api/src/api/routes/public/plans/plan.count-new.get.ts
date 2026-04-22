import { and, count, eq, gt } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { planTable, userPlanVisitTable } from "@/db/schema";
import { planVisibilitySql } from "@/api/routes/@shared/plan-access";
import { CountResponseSchema } from "@/api/schemas/plan.schema";

export const planCountNewGetRoute = new Elysia().get(
  "/count-new",
  async ({ query }) => {
    if (!query.userId) {
      const [result] = await db
        .select({ count: count() })
        .from(planTable)
        .where(and(eq(planTable.status, "open"), planVisibilitySql(undefined)));

      return { success: true, count: result.count };
    }

    const visit = await db
      .select({ lastVisitedAt: userPlanVisitTable.lastVisitedAt })
      .from(userPlanVisitTable)
      .where(eq(userPlanVisitTable.userId, query.userId))
      .limit(1)
      .execute();

    const lastVisited = visit[0]?.lastVisitedAt ?? new Date(0);

    const [result] = await db
      .select({ count: count() })
      .from(planTable)
      .where(
        and(
          eq(planTable.status, "open"),
          gt(planTable.createdAt, lastVisited),
          planVisibilitySql(query.userId),
        ),
      );

    return { success: true, count: result.count };
  },
  {
    query: t.Object({
      userId: t.Optional(t.String()),
    }),
    response: CountResponseSchema,
  },
);
