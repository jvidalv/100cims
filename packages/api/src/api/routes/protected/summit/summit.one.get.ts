import { and, eq, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import {
  mountainRatingTable,
  summitHasUsersTable,
  mountainTable,
  summitTable,
  userTable,
} from "@/db/schema";
import { getUserFromRequest } from "@/api/routes/@shared/auth";
import { SuccessResponse } from "@/api/schemas/common.schema";
import { SummitDetailSchema } from "@/api/schemas/summit.schema";

export const summitOneGetRoute = new Elysia().get(
  "/one",
  async ({ query, request }) => {
    const { summitId } = query;
    const viewer = getUserFromRequest(request);

    const [summit] = await db
      .select({
        summitId: summitTable.id,
        summitAuthorId: summitTable.userId,
        summitedAt: summitTable.summitedAt,
        summitValidated: summitTable.validated,
        summitImageUrl: summitTable.imageUrl,
        mountainId: mountainTable.id,
        mountainName: mountainTable.name,
        mountainSlug: mountainTable.slug,
        mountainLocation: mountainTable.location,
        mountainEssential: mountainTable.essential,
        mountainHeight: mountainTable.height,
        mountainLatitude: mountainTable.latitude,
        mountainLongitude: mountainTable.longitude,
        mountainImageUrl: mountainTable.imageUrl,
        users: sql<
          {
            userId: string;
            firstName: string | null;
            lastName: string | null;
            imageUrl: string | null;
          }[]
        >`ARRAY(
          SELECT jsonb_build_object(
            'userId', ${userTable.id},
            'firstName', ${userTable.firstName},
            'lastName', ${userTable.lastName},
            'imageUrl', ${userTable.imageUrl}
          )
          FROM ${summitHasUsersTable}
          INNER JOIN ${userTable}
          ON ${summitHasUsersTable.userId} = ${userTable.id}
          WHERE ${summitHasUsersTable.summitId} = ${summitTable.id}
        )`.as("users"),
      })
      .from(summitTable)
      .innerJoin(mountainTable, eq(summitTable.mountainId, mountainTable.id))
      .where(eq(summitTable.id, summitId));

    const [viewerRating, authorRating] = await Promise.all([
      db
        .select({
          familyFriendly: mountainRatingTable.familyFriendly,
          dogFriendly: mountainRatingTable.dogFriendly,
          difficulty: mountainRatingTable.difficulty,
        })
        .from(mountainRatingTable)
        .where(
          and(
            eq(mountainRatingTable.mountainId, summit.mountainId),
            eq(mountainRatingTable.userId, viewer.id),
          ),
        )
        .then((rows) => rows[0]),
      summit.summitAuthorId
        ? db
            .select({
              familyFriendly: mountainRatingTable.familyFriendly,
              dogFriendly: mountainRatingTable.dogFriendly,
              difficulty: mountainRatingTable.difficulty,
            })
            .from(mountainRatingTable)
            .where(
              and(
                eq(mountainRatingTable.mountainId, summit.mountainId),
                eq(mountainRatingTable.userId, summit.summitAuthorId),
              ),
            )
            .then((rows) => rows[0])
        : Promise.resolve(undefined),
    ]);

    const { summitAuthorId, ...rest } = summit;
    void summitAuthorId; // not part of the response schema; used only above

    return {
      success: true,
      message: {
        ...rest,
        viewerFamilyFriendly: viewerRating?.familyFriendly ?? null,
        viewerDogFriendly: viewerRating?.dogFriendly ?? null,
        viewerDifficulty: viewerRating?.difficulty ?? null,
        authorFamilyFriendly: authorRating?.familyFriendly ?? null,
        authorDogFriendly: authorRating?.dogFriendly ?? null,
        authorDifficulty: authorRating?.difficulty ?? null,
      },
    };
  },
  {
    query: t.Object({
      summitId: t.String(),
    }),
    response: SuccessResponse(SummitDetailSchema),
  },
);
