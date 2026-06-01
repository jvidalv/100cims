import { and, eq, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { getUserFromRequest } from "@/api/routes/@shared/auth";
import { ChallengeMyProgressSchema } from "@/api/schemas/challenge.schema";
import {
  SuccessResponse,
  ErrorFieldResponse,
} from "@/api/schemas/common.schema";
import { db } from "@/db";
import {
  challengeHasMountainTable,
  mountainTable,
  summitHasUsersTable,
  summitTable,
} from "@/db/schema";

/**
 * Returns the viewing user's progress in a single challenge — total mountains
 * and essentials in the challenge alongside how many the user has summited.
 * Drives the "Your stats" section on the challenge detail page.
 *
 * Two aggregates run in parallel: the per-challenge totals (counts over
 * challenge_has_mountain ↔ mountain), and the user's distinct summited
 * mountains restricted to that challenge.
 */
export const challengeMyProgressGetRoute = new Elysia().get(
  "/my-progress",
  async ({ query, request, set }) => {
    const user = getUserFromRequest(request);

    const [totals, summited] = await Promise.all([
      db
        .select({
          total: sql<number>`COUNT(DISTINCT ${mountainTable.id})`,
          totalEssential: sql<number>`COUNT(DISTINCT CASE WHEN ${mountainTable.essential} THEN ${mountainTable.id} ELSE NULL END)`,
        })
        .from(challengeHasMountainTable)
        .innerJoin(
          mountainTable,
          eq(challengeHasMountainTable.mountainId, mountainTable.id),
        )
        .where(eq(challengeHasMountainTable.challengeId, query.id)),
      db
        .select({
          summited: sql<number>`COUNT(DISTINCT ${mountainTable.id})`,
          summitedEssential: sql<number>`COUNT(DISTINCT CASE WHEN ${mountainTable.essential} THEN ${mountainTable.id} ELSE NULL END)`,
        })
        .from(summitHasUsersTable)
        .innerJoin(
          summitTable,
          eq(summitHasUsersTable.summitId, summitTable.id),
        )
        .innerJoin(mountainTable, eq(summitTable.mountainId, mountainTable.id))
        .innerJoin(
          challengeHasMountainTable,
          eq(mountainTable.id, challengeHasMountainTable.mountainId),
        )
        .where(
          and(
            eq(summitHasUsersTable.userId, user.id),
            eq(challengeHasMountainTable.challengeId, query.id),
          ),
        ),
    ]);

    const totalMountains = Number(totals[0]?.total ?? 0);
    const totalEssentialMountains = Number(totals[0]?.totalEssential ?? 0);
    const summitedCount = Number(summited[0]?.summited ?? 0);
    const summitedEssentialCount = Number(summited[0]?.summitedEssential ?? 0);

    if (totalMountains === 0) {
      // No mountains linked to this challenge — either it's empty or the id
      // is bogus. Returning a 404 makes the mobile drop the section cleanly.
      set.status = 404;
      return { error: "Challenge not found" };
    }

    return {
      success: true,
      message: {
        challengeId: query.id,
        totalMountains,
        totalEssentialMountains,
        summitedCount,
        summitedEssentialCount,
      },
    };
  },
  {
    query: t.Object({ id: t.String() }),
    response: {
      200: SuccessResponse(ChallengeMyProgressSchema),
      404: ErrorFieldResponse,
    },
  },
);
