import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { userTable } from "@/db/schema";
import { SuccessResponse } from "@/api/schemas/common.schema";
import { UserSchema } from "@/api/schemas/user.schema";

export const userOneGetRoute = new Elysia().get(
  "/one",
  async ({ query }) => {
    // Explicit column list — phoneNumber and other private fields are
    // intentionally NOT selected so they can never leak on this public
    // endpoint, even if UserSchema is accidentally widened in the future.
    const users = await db
      .select({
        id: userTable.id,
        email: userTable.email,
        firstName: userTable.firstName,
        lastName: userTable.lastName,
        imageUrl: userTable.imageUrl,
        town: userTable.town,
        visibleOnHiscores: userTable.visibleOnHiscores,
        visibleOnPeopleSearch: userTable.visibleOnPeopleSearch,
        admin: userTable.admin,
        locale: userTable.locale,
        username: userTable.username,
        activeChallengeId: userTable.activeChallengeId,
        unlockables: userTable.unlockables,
        createdAt: userTable.createdAt,
      })
      .from(userTable)
      .where(eq(userTable.id, query.userId));
    const user = users?.[0];

    return {
      success: true,
      message: user,
    };
  },
  {
    query: t.Object({
      userId: t.String(),
    }),
    response: SuccessResponse(UserSchema),
  },
);
