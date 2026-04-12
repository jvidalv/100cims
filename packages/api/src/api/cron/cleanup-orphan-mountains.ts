import { and, eq, isNotNull, notExists } from "drizzle-orm";

import { db } from "@/db";
import { challengeHasMountainTable, mountainTable } from "@/db/schema";

export async function cleanupOrphanMountains(): Promise<void> {
  const deleted = await db
    .delete(mountainTable)
    .where(
      and(
        isNotNull(mountainTable.creatorId),
        notExists(
          db
            .select({ one: challengeHasMountainTable.id })
            .from(challengeHasMountainTable)
            .where(eq(challengeHasMountainTable.mountainId, mountainTable.id)),
        ),
      ),
    )
    .returning({ id: mountainTable.id });

  console.log(
    `[cleanup-orphan-mountains] deleted ${deleted.length} user-created mountain(s) not belonging to any challenge`,
  );
}
