import { and, asc, eq, gte, lte } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { getUserFromRequest } from "@/api/routes/@shared/auth";
import { CalendarResponseSchema } from "@/api/schemas/calendar.schema";
import { SuccessResponse } from "@/api/schemas/common.schema";
import { db } from "@/db";
import { mountainTable, summitHasUsersTable, summitTable } from "@/db/schema";

export const userCalendarGetRoute = new Elysia().get(
  "/calendar",
  async ({ request, query }) => {
    const user = getUserFromRequest(request);

    const rows = await db
      .select({
        id: summitTable.id,
        summitedAt: summitTable.summitedAt,
        mountainName: mountainTable.name,
        mountainSlug: mountainTable.slug,
        mountainHeight: mountainTable.height,
        mountainImageUrl: mountainTable.imageUrl,
      })
      .from(summitHasUsersTable)
      .innerJoin(summitTable, eq(summitHasUsersTable.summitId, summitTable.id))
      .innerJoin(mountainTable, eq(summitTable.mountainId, mountainTable.id))
      .where(
        and(
          eq(summitHasUsersTable.userId, user.id),
          gte(summitTable.summitedAt, query.from),
          lte(summitTable.summitedAt, query.to),
        ),
      )
      .orderBy(asc(summitTable.summitedAt));

    const events = rows.map((row) => ({
      type: "summit" as const,
      date: row.summitedAt,
      id: row.id,
      mountainName: row.mountainName,
      mountainSlug: row.mountainSlug,
      mountainHeight: row.mountainHeight,
      mountainImageUrl: row.mountainImageUrl,
    }));

    return { success: true as const, message: { events } };
  },
  {
    query: t.Object({
      from: t.String({ description: "YYYY-MM-DD inclusive" }),
      to: t.String({ description: "YYYY-MM-DD inclusive" }),
    }),
    response: SuccessResponse(CalendarResponseSchema),
  },
);
