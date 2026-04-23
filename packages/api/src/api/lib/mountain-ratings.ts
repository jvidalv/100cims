import { eq, sql } from "drizzle-orm";

import { db, type DbOrTx } from "@/db";
import { mountainRatingTable, mountainTable } from "@/db/schema";

/**
 * Recompute the denormalized rating aggregates on mountainTable for a single
 * mountain. Call this from every write path that creates, updates, or deletes
 * a row in mountainRatingTable (admin delete, user create/update/delete).
 * Safe to call inside a transaction — pass the tx as `executor`.
 */
export const recalcMountainRatingAggregates = async (
  mountainId: string,
  executor: DbOrTx = db,
): Promise<void> => {
  const [aggs] = await executor
    .select({
      avgFamilyFriendly: sql<
        number | null
      >`AVG(${mountainRatingTable.familyFriendly})::real`,
      familyRatingCount: sql<number>`COUNT(${mountainRatingTable.familyFriendly})::int`,
      avgDogFriendly: sql<
        number | null
      >`AVG(${mountainRatingTable.dogFriendly})::real`,
      dogRatingCount: sql<number>`COUNT(${mountainRatingTable.dogFriendly})::int`,
      avgDifficulty: sql<
        number | null
      >`AVG(${mountainRatingTable.difficulty})::real`,
      difficultyRatingCount: sql<number>`COUNT(${mountainRatingTable.difficulty})::int`,
    })
    .from(mountainRatingTable)
    .where(eq(mountainRatingTable.mountainId, mountainId));

  await executor
    .update(mountainTable)
    .set({
      avgFamilyFriendly: aggs?.avgFamilyFriendly ?? null,
      familyRatingCount: aggs?.familyRatingCount ?? 0,
      avgDogFriendly: aggs?.avgDogFriendly ?? null,
      dogRatingCount: aggs?.dogRatingCount ?? 0,
      avgDifficulty: aggs?.avgDifficulty ?? null,
      difficultyRatingCount: aggs?.difficultyRatingCount ?? 0,
    })
    .where(eq(mountainTable.id, mountainId));
};
