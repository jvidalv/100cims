import { and, countDistinct, eq, inArray, sql } from "drizzle-orm";
import { Elysia } from "elysia";
import { uuidv7 } from "uuidv7";

import { db } from "@/db";
import {
  challengeHasMountainTable,
  challengeTable,
  mountainTable,
  summitTable,
  summitHasUsersTable,
} from "@/db/schema";
import { isBase64SizeValid, reportImageTooBig } from "@/api/lib/images";
import { generateSlug } from "@/api/lib/slug";
import { IMAGE_TO_BIG } from "@/api/routes/@shared/error-codes";
import { getPublicUrl, putImageOnS3 } from "@/api/routes/@shared/s3";
import { getUserFromRequest } from "@/api/routes/@shared/auth";
import {
  SuccessResponse,
  ErrorFieldResponse,
} from "@/api/schemas/common.schema";
import {
  UpdateCommunityChallengeBody,
  CommunityChallengeSchema,
} from "@/api/schemas/community-challenge.schema";

export const challengeUpdatePostRoute = new Elysia().post(
  "/update",
  async ({ body, request, set }) => {
    const user = getUserFromRequest(request);
    const newMountains = body.newMountains ?? [];

    // Validate image size early (before any DB operations)
    if (body.image && !isBase64SizeValid(body.image)) {
      reportImageTooBig(request, {
        route: "community-challenge/update",
        base64Data: body.image,
        userId: user.id,
      });
      set.status = 400;
      return { error: IMAGE_TO_BIG };
    }

    // Validate all new mountain images
    for (const mountain of newMountains) {
      if (!isBase64SizeValid(mountain.image)) {
        reportImageTooBig(request, {
          route: "community-challenge/update#newMountain",
          base64Data: mountain.image,
          userId: user.id,
        });
        set.status = 400;
        return { error: IMAGE_TO_BIG };
      }
    }

    // Check if challenge exists and user is authorized
    const existing = await db
      .select({ id: challengeTable.id, creatorId: challengeTable.creatorId })
      .from(challengeTable)
      .where(eq(challengeTable.id, body.id))
      .limit(1);

    if (!existing.length) {
      set.status = 404;
      return { error: "Challenge not found" };
    }

    if (existing[0].creatorId !== user.id) {
      set.status = 403;
      return { error: "Not authorized to update this challenge" };
    }

    // Get current mountain count to validate minimum of 1 after update
    const currentMountainsCount = await db
      .select({ mountainId: challengeHasMountainTable.mountainId })
      .from(challengeHasMountainTable)
      .where(eq(challengeHasMountainTable.challengeId, body.id));

    const currentIds = currentMountainsCount
      .map((m) => m.mountainId)
      .filter((id): id is string => id !== null);

    // Calculate final mountain count
    if (body.mountainIds !== undefined) {
      const finalExistingIds = body.mountainIds;
      const finalCount = finalExistingIds.length + newMountains.length;
      if (finalCount < 1) {
        set.status = 400;
        return { error: "AT_LEAST_ONE_MOUNTAIN_REQUIRED" };
      }
    }

    // Handle image upload after authorization check
    let imageUrl: string | undefined;
    if (body.image) {
      const key = `${process.env.APP_NAME}/challenge/${body.id}/${uuidv7()}.jpeg`;
      const content = Buffer.from(body.image, "base64");
      await putImageOnS3(key, content);
      imageUrl = getPublicUrl(key);
    }

    // Update challenge and mountains in a transaction
    const updated = await db.transaction(async (tx) => {
      const [result] = await tx
        .update(challengeTable)
        .set({
          name: body.name,
          description: body.description,
          country: body.country,
          isPublic: body.isPublic,
          imageUrl: imageUrl,
          emoji: body.emoji,
        })
        .where(eq(challengeTable.id, body.id))
        .returning();

      // Create new mountains first
      const createdMountainIds: string[] = [];
      for (const mountain of newMountains) {
        const mountainId = uuidv7();
        const key = `${process.env.APP_NAME}/mountain/profile/${mountainId}.jpeg`;
        const content = Buffer.from(mountain.image, "base64");
        await putImageOnS3(key, content);
        const mountainImageUrl = getPublicUrl(key);

        const mountainBaseSlug = generateSlug(mountain.name);
        const mountainSlug = `${mountainBaseSlug}-${mountainId.substring(0, 8)}`;

        await tx.insert(mountainTable).values({
          id: mountainId,
          name: mountain.name,
          slug: mountainSlug,
          location: mountain.location,
          height: mountain.height.toString(),
          latitude: mountain.latitude.toString(),
          longitude: mountain.longitude.toString(),
          essential: mountain.essential ?? false,
          creatorId: user.id,
          imageUrl: mountainImageUrl,
        });

        createdMountainIds.push(mountainId);
      }

      // Update mountain links if provided
      if (body.mountainIds !== undefined) {
        // All IDs to keep (provided IDs + newly created)
        const newIds = [...body.mountainIds, ...createdMountainIds];

        // Find mountains to add and remove
        const toAdd = newIds.filter((id) => !currentIds.includes(id));
        const toRemove = currentIds.filter((id) => !newIds.includes(id));

        // Remove mountains
        if (toRemove.length > 0) {
          await tx
            .delete(challengeHasMountainTable)
            .where(
              and(
                eq(challengeHasMountainTable.challengeId, body.id),
                inArray(challengeHasMountainTable.mountainId, toRemove),
              ),
            );
        }

        // Add mountains
        if (toAdd.length > 0) {
          await tx.insert(challengeHasMountainTable).values(
            toAdd.map((mountainId) => ({
              challengeId: body.id,
              mountainId,
            })),
          );
        }
      } else if (createdMountainIds.length > 0) {
        // If mountainIds not provided but new mountains were created, just add them
        await tx.insert(challengeHasMountainTable).values(
          createdMountainIds.map((mountainId) => ({
            challengeId: body.id,
            mountainId,
          })),
        );
      }

      return result;
    });

    if (!updated) {
      set.status = 404;
      return { error: "Challenge not found" };
    }

    // Get mountain and user counts
    const countsResult = await db
      .select({
        totalMountains: countDistinct(challengeHasMountainTable.mountainId),
        totalUsers: sql<number>`COUNT(DISTINCT COALESCE(${summitHasUsersTable.userId}, ${summitTable.userId}))`,
      })
      .from(challengeHasMountainTable)
      .leftJoin(
        mountainTable,
        eq(challengeHasMountainTable.mountainId, mountainTable.id),
      )
      .leftJoin(summitTable, eq(mountainTable.id, summitTable.mountainId))
      .leftJoin(
        summitHasUsersTable,
        eq(summitTable.id, summitHasUsersTable.summitId),
      )
      .where(eq(challengeHasMountainTable.challengeId, updated.id));

    return {
      success: true,
      message: {
        id: updated.id,
        name: updated.name,
        slug: updated.slug,
        description: updated.description,
        country: updated.country,
        imageUrl: updated.imageUrl,
        emoji: updated.emoji,
        isPublic: updated.isPublic,
        creatorId: updated.creatorId,
        totalMountains: String(countsResult[0]?.totalMountains ?? 0),
        totalUsers: String(countsResult[0]?.totalUsers ?? 0),
        createdAt: updated.createdAt.toISOString(),
      },
    };
  },
  {
    body: UpdateCommunityChallengeBody,
    response: {
      200: SuccessResponse(CommunityChallengeSchema),
      400: ErrorFieldResponse,
      403: ErrorFieldResponse,
      404: ErrorFieldResponse,
    },
  },
);
