import { and, eq, isNotNull, or } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import {
  challengeHasMountainTable,
  challengeTable,
  mountainTable,
} from "@/db/schema";
import { JWT } from "@/api/routes/@shared/jwt";
import { getStoreUser } from "@/api/routes/@shared/store";
import {
  SuccessResponse,
  ErrorFieldResponse,
} from "@/api/schemas/common.schema";
import { CommunityChallengeDetailSchema } from "@/api/schemas/community-challenge.schema";

export const detailRoute = new Elysia()
  .use(JWT())
  .get(
    "/detail",
    async ({ query, store, set }) => {
      const user = getStoreUser(store);

      // Single query: fetch challenge with mountains using LEFT JOIN
      const results = await db
        .select({
          // Challenge fields
          id: challengeTable.id,
          name: challengeTable.name,
          slug: challengeTable.slug,
          description: challengeTable.description,
          country: challengeTable.country,
          imageUrl: challengeTable.imageUrl,
          emoji: challengeTable.emoji,
          isPublic: challengeTable.isPublic,
          creatorId: challengeTable.creatorId,
          createdAt: challengeTable.createdAt,
          // Mountain fields (nullable due to LEFT JOIN)
          mountainId: mountainTable.id,
          mountainName: mountainTable.name,
          mountainSlug: mountainTable.slug,
          mountainLocation: mountainTable.location,
          mountainHeight: mountainTable.height,
          mountainLatitude: mountainTable.latitude,
          mountainLongitude: mountainTable.longitude,
          mountainImageUrl: mountainTable.imageUrl,
          mountainEssential: mountainTable.essential,
        })
        .from(challengeTable)
        .leftJoin(
          challengeHasMountainTable,
          eq(challengeTable.id, challengeHasMountainTable.challengeId)
        )
        .leftJoin(
          mountainTable,
          eq(challengeHasMountainTable.mountainId, mountainTable.id)
        )
        .where(
          and(
            eq(challengeTable.id, query.id),
            isNotNull(challengeTable.creatorId),
            or(
              eq(challengeTable.creatorId, user.id),
              eq(challengeTable.isPublic, true)
            )
          )
        );

      if (!results.length) {
        set.status = 404;
        return { error: "Challenge not found" };
      }

      // First row has challenge data
      const challenge = results[0];

      // Collect mountains from all rows (filter out nulls from LEFT JOIN)
      const mountains = results
        .filter((r) => r.mountainId !== null)
        .map((r) => ({
          id: r.mountainId!,
          name: r.mountainName!,
          slug: r.mountainSlug!,
          location: r.mountainLocation!,
          height: r.mountainHeight!,
          latitude: r.mountainLatitude!,
          longitude: r.mountainLongitude!,
          imageUrl: r.mountainImageUrl,
          essential: r.mountainEssential!,
        }));

      return {
        success: true,
        message: {
          id: challenge.id,
          name: challenge.name,
          slug: challenge.slug,
          description: challenge.description,
          country: challenge.country,
          imageUrl: challenge.imageUrl,
          emoji: challenge.emoji,
          isPublic: challenge.isPublic,
          creatorId: challenge.creatorId,
          createdAt: challenge.createdAt.toISOString(),
          mountains,
        },
      };
    },
    {
      query: t.Object({
        id: t.String(),
      }),
      response: {
        200: SuccessResponse(CommunityChallengeDetailSchema),
        404: ErrorFieldResponse,
      },
    }
  );
