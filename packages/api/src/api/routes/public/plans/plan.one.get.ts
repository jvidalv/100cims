import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import {
  planTable,
  planHasUsersTable,
  userTable,
  planHasMountainsTable,
  mountainTable,
} from "@/db/schema";
import { SuccessResponse, ErrorResponse } from "@/api/schemas/common.schema";
import { PlanDetailSchema } from "@/api/schemas/plan.schema";

export const planOneGetRoute = new Elysia().get(
  "/one",
  async ({ query, set }) => {
    const plan = await db
      .select({
        id: planTable.id,
        title: planTable.title,
        description: planTable.description,
        imageUrl: planTable.imageUrl,
        speed: planTable.speed,
        status: planTable.status,
        routeUrl: planTable.routeUrl,
        startDate: planTable.startDate,
        creatorId: planTable.creatorId,
        createdAt: planTable.createdAt,
        updatedAt: planTable.updatedAt,
      })
      .from(planTable)
      .where(eq(planTable.id, query.id))
      .limit(1)
      .execute();

    if (!plan.length) {
      set.status = 404;
      return { success: false, message: "NOT_FOUND" };
    }

    const [users, mountains] = await Promise.all([
      db
        .select({
          userId: userTable.id,
          firstName: userTable.firstName,
          lastName: userTable.lastName,
          imageUrl: userTable.imageUrl,
          willBringDogs: planHasUsersTable.willBringDogs,
        })
        .from(planHasUsersTable)
        .innerJoin(userTable, eq(planHasUsersTable.userId, userTable.id))
        .where(eq(planHasUsersTable.planId, query.id)),

      db
        .select({
          mountainId: mountainTable.id,
          name: mountainTable.name,
          slug: mountainTable.slug,
          imageUrl: mountainTable.imageUrl,
          location: mountainTable.location,
          essential: mountainTable.essential,
          height: mountainTable.height,
        })
        .from(planHasMountainsTable)
        .innerJoin(
          mountainTable,
          eq(planHasMountainsTable.mountainId, mountainTable.id),
        )
        .where(eq(planHasMountainsTable.planId, query.id)),
    ]);

    return {
      success: true,
      message: {
        ...plan[0],
        users: users.map((u) => ({
          id: u.userId,
          firstName: u.firstName,
          lastName: u.lastName,
          imageUrl: u.imageUrl,
          willBringDogs: u.willBringDogs,
        })),
        mountains: mountains.map((m) => ({
          id: m.mountainId,
          name: m.name,
          slug: m.slug,
          imageUrl: m.imageUrl,
          location: m.location,
          height: m.height,
          essential: m.essential,
        })),
      },
    };
  },
  {
    query: t.Object({
      id: t.String(),
    }),
    response: {
      200: SuccessResponse(PlanDetailSchema),
      404: ErrorResponse,
    },
  },
);
