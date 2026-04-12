import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { challengeTable, userTable } from "@/db/schema";
import { AdminUserDetailSchema } from "@/api/schemas/admin.schema";
import {
  ErrorFieldResponse,
  SuccessResponse,
} from "@/api/schemas/common.schema";

export const adminUserDetailGetRoute = new Elysia().get(
  "/users/:id",
  async ({ params, set }) => {
    const [row] = await db
      .select({
        id: userTable.id,
        email: userTable.email,
        username: userTable.username,
        firstName: userTable.firstName,
        lastName: userTable.lastName,
        imageUrl: userTable.imageUrl,
        town: userTable.town,
        country: userTable.country,
        platform: userTable.platform,
        appVersion: userTable.appVersion,
        locale: userTable.locale,
        visibleOnHiscores: userTable.visibleOnHiscores,
        visibleOnPeopleSearch: userTable.visibleOnPeopleSearch,
        admin: userTable.admin,
        activeChallengeId: userTable.activeChallengeId,
        activeChallengeName: challengeTable.name,
        createdAt: userTable.createdAt,
      })
      .from(userTable)
      .leftJoin(
        challengeTable,
        eq(userTable.activeChallengeId, challengeTable.id),
      )
      .where(eq(userTable.id, params.id));

    if (!row) {
      set.status = 404;
      return { error: "User not found" };
    }
    return { success: true, message: row };
  },
  {
    params: t.Object({ id: t.String() }),
    response: {
      200: SuccessResponse(AdminUserDetailSchema),
      404: ErrorFieldResponse,
    },
  },
);
