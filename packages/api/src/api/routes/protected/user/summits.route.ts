import { desc, eq } from "drizzle-orm";
import { Elysia } from "elysia";

import { db } from "@/db";
import { mountainTable, summitHasUsersTable, summitTable } from "@/db/schema";
import { JWT } from "@/api/routes/@shared/jwt";
import { getStoreUser } from "@/api/routes/@shared/store";
import { SuccessResponse } from "@/api/schemas/common.schema";
import { UserSummitsResponseSchema } from "@/api/schemas/user.schema";

export const summitsRoute = new Elysia().use(JWT()).get(
  "/summits",
  async ({ store }) => {
    const user = getStoreUser(store);
    const userId = user.id;

    // Return ALL user summits regardless of challenge
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
      .where(eq(summitHasUsersTable.userId, userId))
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
