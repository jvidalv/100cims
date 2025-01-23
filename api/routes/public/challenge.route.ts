import { sql } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/api/db";
import {
  challengeHasMountainTable,
  challengeTable,
  mountainTable,
} from "@/api/db/schema";

export const challengeRoute = new Elysia({ prefix: "/challenge" }).get(
  "/all",
  async () => {
    const challengesWithCounts = await db
      .select({
        id: challengeTable.id,
        name: challengeTable.name,
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
      .groupBy(challengeTable.id);

    return {
      success: true,
      message: challengesWithCounts,
    };
  },
  {
    response: {
      200: t.Object({
        success: t.Boolean(),
        message: t.Array(
          t.Object({
            id: t.String(),
            name: t.String(),
            country: t.String(),
            totalMountains: t.String(),
            totalEssentialMountains: t.String(),
          }),
        ),
      }),
    },
  },
);
