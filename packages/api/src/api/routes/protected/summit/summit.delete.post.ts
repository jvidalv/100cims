import { and, count, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { summitHasUsersTable, summitTable } from "@/db/schema";
import { getUserFromRequest } from "@/api/routes/@shared/auth";

export const summitDeletePostRoute = new Elysia().post(
  "/delete",
  async ({ body, request }) => {
    const { summitId } = body;

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

    const summit = await db
      .select({ ownerId: summitTable.userId })
      .from(summitTable)
      .where(eq(summitTable.id, summitId));

    const isOwner = summit[0]?.ownerId === userId;

    await db.transaction(async (tx) => {
      const userCount = await tx
        .select({ count: count() })
        .from(summitHasUsersTable)
        .where(eq(summitHasUsersTable.summitId, summitId));

      await tx
        .delete(summitHasUsersTable)
        .where(
          and(
            eq(summitHasUsersTable.summitId, summitId),
            eq(summitHasUsersTable.userId, userId),
          ),
        );

      if (isOwner || userCount[0].count === 1) {
        await tx.delete(summitTable).where(eq(summitTable.id, summitId));
      }
    });

    return { success: true, message: "Summit record deleted successfully" };
  },
  {
    body: t.Object({
      summitId: t.String(),
    }),
    response: t.Object({
      success: t.Boolean(),
      message: t.String(),
    }),
  },
);
