import { and, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { userSavedRouteTable } from "@/db/schema";
import { getUserFromRequest } from "@/api/routes/@shared/auth";
import { SimpleSuccessResponse } from "@/api/schemas/common.schema";

export const userSavedRoutesRemoveDeleteRoute = new Elysia().delete(
  "/saved-routes/:routeId",
  async ({ request, params }) => {
    const user = getUserFromRequest(request);
    await db
      .delete(userSavedRouteTable)
      .where(
        and(
          eq(userSavedRouteTable.userId, user.id),
          eq(userSavedRouteTable.routeId, params.routeId),
        ),
      );
    return { success: true };
  },
  {
    params: t.Object({ routeId: t.String() }),
    response: SimpleSuccessResponse,
  },
);
