import { count, eq, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { summitReactionTable } from "@/db/schema";
import { getUserFromRequest } from "@/api/routes/@shared/auth";

export const summitReactionsGetRoute = new Elysia().get(
  "/reactions",
  async ({ query, request }) => {
    const { summitId } = query;

    const userId = getUserFromRequest(request).id;

    const reactions = await db
      .select({
        emoji: summitReactionTable.emoji,
        count: count(),
        userReacted: sql<boolean>`bool_or(${summitReactionTable.userId} = ${userId})`,
      })
      .from(summitReactionTable)
      .where(eq(summitReactionTable.summitId, summitId))
      .groupBy(summitReactionTable.emoji);

    return {
      success: true,
      message: {
        reactions: reactions.map((r) => ({
          emoji: r.emoji,
          count: Number(r.count),
        })),
        userReactions: reactions
          .filter((r) => r.userReacted)
          .map((r) => r.emoji),
      },
    };
  },
  {
    query: t.Object({
      summitId: t.String(),
    }),
    response: t.Object({
      success: t.Boolean(),
      message: t.Object({
        reactions: t.Array(
          t.Object({
            emoji: t.String(),
            count: t.Number(),
          }),
        ),
        userReactions: t.Array(t.String()),
      }),
    }),
  },
);
