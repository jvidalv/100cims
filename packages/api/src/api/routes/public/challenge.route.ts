import { sql } from "drizzle-orm";
import { Elysia } from "elysia";

import { db } from "@/db";
import {
  challengeHasMountainTable,
  challengeTable,
  mountainTable,
} from "@/db/schema";
import { SuccessResponse } from "@/api/schemas/common.schema";
import { ChallengesArraySchema } from "@/api/schemas/challenge.schema";

export const challengeRoute = new Elysia({ prefix: "/challenge" }).get(
  "/all",
  async () => {
    const challengesWithCounts = await db
      .select({
        id: challengeTable.id,
        name: challengeTable.name,
        slug: challengeTable.slug,
        country: challengeTable.country,
        totalMountains: sql<string>`COUNT(${challengeHasMountainTable.mountainId})`,
        totalEssentialMountains: sql<string>`SUM(CASE WHEN ${mountainTable.essential} THEN 1 ELSE 0 END)`,
      })
      .from(challengeTable)
      .leftJoin(
        challengeHasMountainTable,
        sql`${challengeTable.id} = ${challengeHasMountainTable.challengeId}`,
      )
      .leftJoin(
        mountainTable,
        sql`${challengeHasMountainTable.mountainId} = ${mountainTable.id}`,
      )
      .groupBy(challengeTable.id, challengeTable.slug);

    const prioritySlugs = ["100-cims", "100-cims-usa"];

    const sorted = challengesWithCounts.sort((a, b) => {
      const indexA = prioritySlugs.indexOf(a.slug);
      const indexB = prioritySlugs.indexOf(b.slug);

      const isAInList = indexA !== -1;
      const isBInList = indexB !== -1;

      if (isAInList && isBInList) {
        return indexA - indexB;
      }

      if (isAInList) return -1;
      if (isBInList) return 1;

      return 0; // keep relative order of others
    });

    return {
      success: true,
      message: sorted,
    };
  },
  {
    response: SuccessResponse(ChallengesArraySchema),
  },
);
