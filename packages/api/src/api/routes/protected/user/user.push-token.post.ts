import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { userTable } from "@/db/schema";
import { getUserFromRequest } from "@/api/routes/@shared/auth";
import { SimpleSuccessResponse } from "@/api/schemas/common.schema";

export const userPushTokenPostRoute = new Elysia().post(
  "/push-token",
  async ({ body, request }) => {
    const user = getUserFromRequest(request);

    await db
      .update(userTable)
      .set({
        expoPushToken: body.expoPushToken,
        ...(body.pushNotificationsEnabled !== undefined && {
          pushNotificationsEnabled: body.pushNotificationsEnabled,
        }),
      })
      .where(eq(userTable.id, user.id));

    return { success: true };
  },
  {
    body: t.Object({
      expoPushToken: t.Union([t.String(), t.Null()]),
      pushNotificationsEnabled: t.Optional(t.Boolean()),
    }),
    response: {
      200: SimpleSuccessResponse,
    },
  },
);
