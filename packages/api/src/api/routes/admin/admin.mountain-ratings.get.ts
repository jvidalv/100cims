import { desc, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { mountainRatingTable, userTable } from "@/db/schema";
import { AdminMountainRatingsResponseSchema } from "@/api/schemas/admin-mountain.schema";
import { SuccessResponse } from "@/api/schemas/common.schema";

export const adminMountainRatingsGetRoute = new Elysia().get(
  "/mountains/:id/ratings",
  async ({ params }) => {
    const rows = await db
      .select({
        id: mountainRatingTable.id,
        familyFriendly: mountainRatingTable.familyFriendly,
        dogFriendly: mountainRatingTable.dogFriendly,
        difficulty: mountainRatingTable.difficulty,
        createdAt: mountainRatingTable.createdAt,
        updatedAt: mountainRatingTable.updatedAt,
        user: {
          id: userTable.id,
          username: userTable.username,
          firstName: userTable.firstName,
          lastName: userTable.lastName,
          imageUrl: userTable.imageUrl,
          email: userTable.email,
        },
      })
      .from(mountainRatingTable)
      .innerJoin(userTable, eq(mountainRatingTable.userId, userTable.id))
      .where(eq(mountainRatingTable.mountainId, params.id))
      .orderBy(desc(mountainRatingTable.updatedAt));

    return { success: true, message: rows };
  },
  {
    params: t.Object({ id: t.String() }),
    response: SuccessResponse(AdminMountainRatingsResponseSchema),
  },
);
