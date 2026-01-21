import { eq, isNotNull, and, inArray } from "drizzle-orm";
import { Elysia } from "elysia";
import { uuidv7 } from "uuidv7";

import { db } from "@/db";
import {
  challengeTable,
  mountainTable,
  challengeHasMountainTable,
} from "@/db/schema";
import { isBase64SizeValid } from "@/api/lib/images";
import { generateSlug } from "@/api/lib/slug";
import { IMAGE_TO_BIG } from "@/api/routes/@shared/error-codes";
import { JWT } from "@/api/routes/@shared/jwt";
import { getPublicUrl, putImageOnS3 } from "@/api/routes/@shared/s3";
import { getStoreUser } from "@/api/routes/@shared/store";
import {
  SuccessResponse,
  ErrorFieldResponse,
} from "@/api/schemas/common.schema";
import {
  CreateCommunityChallengeBody,
  CommunityChallengeSchema,
} from "@/api/schemas/community-challenge.schema";

const MAX_CHALLENGES_PER_USER = 5;

export const createRoute = new Elysia().use(JWT()).post(
  "/create",
  async ({ body, store, set }) => {
    const user = getStoreUser(store);

    // Validate that at least 1 mountain is provided
    const existingMountainIds = body.mountainIds ?? [];
    const newMountains = body.newMountains ?? [];
    const totalMountains = existingMountainIds.length + newMountains.length;

    if (totalMountains < 1) {
      set.status = 400;
      return { error: "AT_LEAST_ONE_MOUNTAIN_REQUIRED" };
    }

    // Check if user has reached the limit
    const existingChallenges = await db
      .select({ id: challengeTable.id })
      .from(challengeTable)
      .where(
        and(
          eq(challengeTable.creatorId, user.id),
          isNotNull(challengeTable.creatorId),
        ),
      );

    if (existingChallenges.length >= MAX_CHALLENGES_PER_USER) {
      set.status = 400;
      return { error: "MAX_CHALLENGES_REACHED" };
    }

    // Validate challenge image size
    if (body.image && !isBase64SizeValid(body.image, 2048)) {
      set.status = 400;
      return { error: IMAGE_TO_BIG };
    }

    // Validate all new mountain images
    for (const mountain of newMountains) {
      if (!isBase64SizeValid(mountain.image, 2048)) {
        set.status = 400;
        return { error: IMAGE_TO_BIG };
      }
    }

    // Validate existing mountain IDs exist
    if (existingMountainIds.length > 0) {
      const existingMountainsFromDb = await db
        .select({ id: mountainTable.id })
        .from(mountainTable)
        .where(inArray(mountainTable.id, existingMountainIds));

      if (existingMountainsFromDb.length !== existingMountainIds.length) {
        set.status = 400;
        return { error: "INVALID_MOUNTAIN_ID" };
      }
    }

    const challengeId = uuidv7();

    // Handle challenge image upload
    let challengeImageUrl: string | null = null;
    if (body.image) {
      const key = `${process.env.APP_NAME}/challenge/${challengeId}.jpeg`;
      const content = Buffer.from(body.image, "base64");
      await putImageOnS3(key, content);
      challengeImageUrl = getPublicUrl(key);
    }

    // Generate unique slug
    const baseSlug = generateSlug(body.name);
    const slug = `${baseSlug}-${challengeId.substring(0, 8)}`;

    // Create everything in a transaction
    const result = await db.transaction(async (tx) => {
      // 1. Create the challenge
      const [inserted] = await tx
        .insert(challengeTable)
        .values({
          id: challengeId,
          name: body.name,
          slug,
          country: body.country,
          creatorId: user.id,
          description: body.description ?? null,
          imageUrl: challengeImageUrl,
          emoji: body.emoji ?? null,
          isPublic: body.isPublic ?? true,
        })
        .returning();

      // 2. Create new mountains
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

      // 3. Link all mountains to the challenge
      const allMountainIds = [...existingMountainIds, ...createdMountainIds];
      if (allMountainIds.length > 0) {
        await tx.insert(challengeHasMountainTable).values(
          allMountainIds.map((mountainId) => ({
            challengeId,
            mountainId,
          })),
        );
      }

      return {
        challenge: inserted,
        totalMountains: allMountainIds.length,
      };
    });

    return {
      success: true,
      message: {
        id: result.challenge.id,
        name: result.challenge.name,
        slug: result.challenge.slug,
        description: result.challenge.description,
        country: result.challenge.country,
        imageUrl: result.challenge.imageUrl,
        emoji: result.challenge.emoji,
        isPublic: result.challenge.isPublic,
        creatorId: result.challenge.creatorId,
        totalMountains: String(result.totalMountains),
        totalUsers: "0",
        createdAt: result.challenge.createdAt.toISOString(),
      },
    };
  },
  {
    body: CreateCommunityChallengeBody,
    response: {
      200: SuccessResponse(CommunityChallengeSchema),
      400: ErrorFieldResponse,
    },
  },
);
