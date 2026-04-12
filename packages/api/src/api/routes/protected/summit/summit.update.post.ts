import { and, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { summitHasUsersTable, summitTable } from "@/db/schema";
import { getUserFromRequest } from "@/api/routes/@shared/auth";

export const summitUpdatePostRoute = new Elysia().post(
  "/update",
  async ({ body, request }) => {
    const { summitId, summitedAt } = body;

    const userId = getUserFromRequest(request).id;

    const summitUserRecord = await db
      .select()
      .from(summitHasUsersTable)
      .where(
        and(
          eq(summitHasUsersTable.summitId, summitId),
          eq(summitHasUsersTable.userId, userId),
        ),
      );

    if (!summitUserRecord.length) {
      return {
        success: false,
        message: "Summit record not found or unauthorized",
      };
    }

    await db
      .update(summitTable)
      .set({ summitedAt })
      .where(eq(summitTable.id, summitId));

    return { success: true, message: "Summit date updated successfully" };
  },
  {
    body: t.Object({
      summitId: t.String(),
      summitedAt: t.String(),
    }),
    response: t.Object({
      success: t.Boolean(),
      message: t.String(),
    }),
  },
);
