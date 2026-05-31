import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { routeTable, userSavedRouteTable } from "@/db/schema";
import { getUserFromRequest } from "@/api/routes/@shared/auth";
import {
  ErrorFieldResponse,
  SimpleSuccessResponse,
} from "@/api/schemas/common.schema";

export const userSavedRoutesAddPostRoute = new Elysia().post(
  "/saved-routes",
  async ({ request, body, set }) => {
    const user = getUserFromRequest(request);

    const [route] = await db
      .select({ id: routeTable.id })
      .from(routeTable)
      .where(eq(routeTable.id, body.routeId))
      .limit(1);
    if (!route) {
      set.status = 404;
      return { error: "Route not found" };
    }

    await db
      .insert(userSavedRouteTable)
      .values({ userId: user.id, routeId: route.id })
      .onConflictDoNothing();

    return { success: true };
  },
  {
    body: t.Object({ routeId: t.String() }),
    response: {
      200: SimpleSuccessResponse,
      404: ErrorFieldResponse,
    },
  },
);
