import { and, desc, eq, inArray } from "drizzle-orm";
import { Elysia } from "elysia";

import { db } from "@/db";
import {
  challengeHasMountainTable,
  mountainTable,
  summitHasUsersTable,
  summitTable,
} from "@/db/schema";
import { resolveChallengeId } from "@/api/routes/@shared/challenge";
import { getUserFromRequest } from "@/api/routes/@shared/auth";
import { SuccessResponse } from "@/api/schemas/common.schema";
import { UserSummitsResponseSchema } from "@/api/schemas/user.schema";

export const userSummitsGetRoute = new Elysia().get(
  "/summits",
  async ({ request }) => {
    const user = getUserFromRequest(request);
    const userId = user.id;
    const challengeId = resolveChallengeId(null, user);

    // Get mountains that belong to the active challenge
    const challengeMountains = await db
      .select({ mountainId: challengeHasMountainTable.mountainId })
      .from(challengeHasMountainTable)
      .where(eq(challengeHasMountainTable.challengeId, challengeId));

    const challengeMountainIds = challengeMountains
      .map((m) => m.mountainId)
      .filter((id): id is string => id !== null);

    // If no mountains in challenge, return empty results
    if (challengeMountainIds.length === 0) {
      return {
        success: true,
        message: {
          score: 0,
          uniquePeaksCount: 0,
          essentialPeaksCount: 0,
          summits: [],
        },
      };
    }

    // Return user summits filtered by active challenge's mountains
    const results = await db
      .select({
        summitId: summitTable.id,
        summitedAt: summitTable.summitedAt,
        summitedValidated: summitTable.validated,
        mountainName: mountainTable.name,
        mountainSlug: mountainTable.slug,
        mountainImageUrl: mountainTable.imageUrl,
        mountainHeight: mountainTable.height,
        mountainEssential: mountainTable.essential,
      })
      .from(summitHasUsersTable)
      .innerJoin(summitTable, eq(summitHasUsersTable.summitId, summitTable.id))
      .innerJoin(mountainTable, eq(summitTable.mountainId, mountainTable.id))
      .where(
        and(
          eq(summitHasUsersTable.userId, userId),
          inArray(mountainTable.id, challengeMountainIds),
        ),
      )
      .orderBy(desc(summitTable.summitedAt), desc(summitTable.createdAt));

    const summitsWithScore = results.map((props) => {
      return {
        ...props,
        score:
          (parseInt(props.mountainHeight) / 10) *
          (props.mountainEssential ? 2 : 1),
      };
    });

    const uniquePeaks = new Set(
      summitsWithScore.map((summit) => summit.mountainSlug),
    );

    const essentialPeaks = new Set(
      summitsWithScore
        .filter((summit) => summit.mountainEssential)
        .map((summit) => summit.mountainSlug),
    );

    return {
      success: true,
      message: {
        score: summitsWithScore.reduce((acc, current) => {
          if (!current.summitedValidated) {
            return acc;
          }

          acc = acc + current.score;
          return acc;
        }, 0),
        uniquePeaksCount: uniquePeaks.size,
        essentialPeaksCount: essentialPeaks.size,
        summits: summitsWithScore,
      },
    };
  },
  {
    response: SuccessResponse(UserSummitsResponseSchema),
  },
);
