import { and, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { userSavedMountainTable } from "@/db/schema";
import { getUserFromRequest } from "@/api/routes/@shared/auth";
import { SimpleSuccessResponse } from "@/api/schemas/common.schema";

export const userSavedRemoveDeleteRoute = new Elysia().delete(
  "/saved/:mountainId",
  async ({ request, params }) => {
    const user = getUserFromRequest(request);
    await db
      .delete(userSavedMountainTable)
      .where(
        and(
          eq(userSavedMountainTable.userId, user.id),
          eq(userSavedMountainTable.mountainId, params.mountainId),
        ),
      );
    return { success: true };
  },
  {
    params: t.Object({ mountainId: t.String() }),
    response: SimpleSuccessResponse,
  },
);
