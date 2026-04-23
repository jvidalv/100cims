import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { mountainTable, userSavedMountainTable } from "@/db/schema";
import { getUserFromRequest } from "@/api/routes/@shared/auth";
import {
  ErrorFieldResponse,
  SimpleSuccessResponse,
} from "@/api/schemas/common.schema";

export const userSavedAddPostRoute = new Elysia().post(
  "/saved",
  async ({ request, body, set }) => {
    const user = getUserFromRequest(request);

    const [mountain] = await db
      .select({ id: mountainTable.id })
      .from(mountainTable)
      .where(eq(mountainTable.id, body.mountainId))
      .limit(1);
    if (!mountain) {
      set.status = 404;
      return { error: "Mountain not found" };
    }

    await db
      .insert(userSavedMountainTable)
      .values({ userId: user.id, mountainId: mountain.id })
      .onConflictDoNothing();

    return { success: true };
  },
  {
    body: t.Object({ mountainId: t.String() }),
    response: {
      200: SimpleSuccessResponse,
      404: ErrorFieldResponse,
    },
  },
);
