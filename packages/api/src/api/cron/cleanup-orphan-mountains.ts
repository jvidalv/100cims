import { and, isNotNull, notInArray } from "drizzle-orm";

import { db } from "@/db";
import { challengeHasMountainTable, mountainTable } from "@/db/schema";

export async function cleanupOrphanMountains(): Promise<void> {
  const mountainsInChallenges = db
    .select({ id: challengeHasMountainTable.mountainId })
    .from(challengeHasMountainTable)
    .where(isNotNull(challengeHasMountainTable.mountainId));

  const deleted = await db
    .delete(mountainTable)
    .where(
      and(
        isNotNull(mountainTable.creatorId),
        notInArray(mountainTable.id, mountainsInChallenges),
      ),
    )
    .returning({ id: mountainTable.id, slug: mountainTable.slug });

  console.log(
    `[cleanup-orphan-mountains] deleted ${deleted.length} user-created mountain(s) not belonging to any challenge`,
  );
}
