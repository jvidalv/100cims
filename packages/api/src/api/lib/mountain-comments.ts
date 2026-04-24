import { eq, sql } from "drizzle-orm";

import { db, type DbOrTx } from "@/db";
import { mountainCommentTable, mountainCommentUpvoteTable } from "@/db/schema";

/**
 * Recompute the denormalized upvoteCount on a mountain comment. Call this from
 * every write path that creates or deletes a row in mountainCommentUpvoteTable.
 * Safe to call inside a transaction — pass the tx as `executor`.
 */
export const recalcMountainCommentUpvoteCount = async (
  commentId: string,
  executor: DbOrTx = db,
): Promise<void> => {
  const [row] = await executor
    .select({
      upvoteCount: sql<number>`COUNT(*)::int`,
    })
    .from(mountainCommentUpvoteTable)
    .where(eq(mountainCommentUpvoteTable.commentId, commentId));

  await executor
    .update(mountainCommentTable)
    .set({ upvoteCount: row?.upvoteCount ?? 0 })
    .where(eq(mountainCommentTable.id, commentId));
};
