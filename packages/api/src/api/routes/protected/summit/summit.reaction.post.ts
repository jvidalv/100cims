import { and, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { summitReactionTable } from "@/db/schema";
import { getUserFromRequest } from "@/api/routes/@shared/auth";

export const summitReactionPostRoute = new Elysia().post(
  "/reaction",
  async ({ body, request }) => {
    const { summitId, emoji } = body;

    const userId = getUserFromRequest(request).id;

    const existingReaction = await db
      .select()
      .from(summitReactionTable)
      .where(
        and(
          eq(summitReactionTable.summitId, summitId),
          eq(summitReactionTable.userId, userId),
          eq(summitReactionTable.emoji, emoji),
        ),
      );

    if (existingReaction.length > 0) {
      await db
        .delete(summitReactionTable)
        .where(eq(summitReactionTable.id, existingReaction[0].id));

      return { success: true, message: "Reaction removed" };
    }

    await db.insert(summitReactionTable).values({
      summitId,
      userId,
      emoji,
    });

    return { success: true, message: "Reaction added" };
  },
  {
    body: t.Object({
      summitId: t.String(),
      emoji: t.String(),
    }),
    response: t.Object({
      success: t.Boolean(),
      message: t.String(),
    }),
  },
);
