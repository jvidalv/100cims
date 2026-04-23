import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { mountainTable } from "@/db/schema";

export const mountainOneGetRoute = new Elysia().get(
  "/one",
  async ({ query }) => {
    const mountain = await db
      .select({
        id: mountainTable.id,
        name: mountainTable.name,
        slug: mountainTable.slug,
        location: mountainTable.location,
        essential: mountainTable.essential,
        height: mountainTable.height,
        latitude: mountainTable.latitude,
        longitude: mountainTable.longitude,
        imageUrl: mountainTable.imageUrl,
        avgFamilyFriendly: mountainTable.avgFamilyFriendly,
        familyRatingCount: mountainTable.familyRatingCount,
        avgDogFriendly: mountainTable.avgDogFriendly,
        dogRatingCount: mountainTable.dogRatingCount,
        avgDifficulty: mountainTable.avgDifficulty,
        difficultyRatingCount: mountainTable.difficultyRatingCount,
      })
      .from(mountainTable)
      .where(eq(mountainTable.slug, query.mountainSlug));

    return {
      success: true,
      message: mountain[0],
    };
  },
  {
    query: t.Object({
      mountainSlug: t.String(),
    }),
    response: t.Object({
      success: t.Boolean(),
      message: t.Object({
        id: t.String(),
        name: t.String(),
        slug: t.String(),
        location: t.String(),
        essential: t.Boolean(),
        height: t.String(),
        latitude: t.String(),
        longitude: t.String(),
        imageUrl: t.Nullable(t.String()),
        avgFamilyFriendly: t.Nullable(t.Number()),
        familyRatingCount: t.Number(),
        avgDogFriendly: t.Nullable(t.Number()),
        dogRatingCount: t.Number(),
        avgDifficulty: t.Nullable(t.Number()),
        difficultyRatingCount: t.Number(),
      }),
    }),
  },
);
