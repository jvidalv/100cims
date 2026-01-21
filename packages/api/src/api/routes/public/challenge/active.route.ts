import { bearer } from "@elysiajs/bearer";
import { eq, sql } from "drizzle-orm";
import { Elysia } from "elysia";

import { db } from "@/db";
import {
  challengeHasMountainTable,
  challengeTable,
  mountainTable,
} from "@/db/schema";
import {
  DEFAULT_CHALLENGE_ID,
  resolveChallengeId,
} from "@/api/routes/@shared/challenge";
import { JWT } from "@/api/routes/@shared/jwt";
import { getOptionalUser } from "@/api/routes/@shared/optional-auth";
import { SuccessResponse } from "@/api/schemas/common.schema";
import { ActiveChallengeSchema } from "@/api/schemas/challenge.schema";

export const activeRoute = new Elysia()
  .use(JWT())
  .use(bearer())
  .get(
    "/active",
    async ({ jwt, bearer }) => {
      const optionalUser = await getOptionalUser(jwt, bearer);
      const challengeId = resolveChallengeId(undefined, optionalUser);

      // Query the challenge (official or community)
      const [challenge] = await db
        .select({
          id: challengeTable.id,
          name: challengeTable.name,
          slug: challengeTable.slug,
          country: challengeTable.country,
          creatorId: challengeTable.creatorId,
          totalMountains: sql<string>`COUNT(DISTINCT ${challengeHasMountainTable.mountainId})`,
          totalEssentialMountains: sql<string>`COALESCE(SUM(CASE WHEN ${mountainTable.essential} THEN 1 ELSE 0 END), 0)`,
        })
        .from(challengeTable)
        .leftJoin(
          challengeHasMountainTable,
          eq(challengeTable.id, challengeHasMountainTable.challengeId),
        )
        .leftJoin(
          mountainTable,
          eq(challengeHasMountainTable.mountainId, mountainTable.id),
        )
        .where(eq(challengeTable.id, challengeId))
        .groupBy(challengeTable.id);

      // If found, return it
      if (challenge) {
        const isOfficial = challenge.creatorId === null;
        return {
          success: true,
          message: {
            id: challenge.id,
            name: challenge.name,
            slug: challenge.slug,
            country: challenge.country,
            totalMountains: challenge.totalMountains,
            totalEssentialMountains: isOfficial
              ? challenge.totalEssentialMountains
              : "0",
            isOfficial,
          },
        };
      }

      // Fallback to default challenge
      const [defaultChallenge] = await db
        .select({
          id: challengeTable.id,
          name: challengeTable.name,
          slug: challengeTable.slug,
          country: challengeTable.country,
          totalMountains: sql<string>`COUNT(DISTINCT ${challengeHasMountainTable.mountainId})`,
          totalEssentialMountains: sql<string>`COALESCE(SUM(CASE WHEN ${mountainTable.essential} THEN 1 ELSE 0 END), 0)`,
        })
        .from(challengeTable)
        .leftJoin(
          challengeHasMountainTable,
          eq(challengeTable.id, challengeHasMountainTable.challengeId),
        )
        .leftJoin(
          mountainTable,
          eq(challengeHasMountainTable.mountainId, mountainTable.id),
        )
        .where(eq(challengeTable.id, DEFAULT_CHALLENGE_ID))
        .groupBy(challengeTable.id);

      if (!defaultChallenge) {
        throw new Error("Default challenge not found");
      }

      return {
        success: true,
        message: {
          id: defaultChallenge.id,
          name: defaultChallenge.name,
          slug: defaultChallenge.slug,
          country: defaultChallenge.country,
          totalMountains: defaultChallenge.totalMountains,
          totalEssentialMountains: defaultChallenge.totalEssentialMountains,
          isOfficial: true,
        },
      };
    },
    {
      response: SuccessResponse(ActiveChallengeSchema),
    },
  );
