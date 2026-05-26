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
import { JWT } from "@/api/routes/@shared/jwt";
import {
  getBearerToken,
  getOptionalUserId,
} from "@/api/routes/@shared/optional-auth";
import { canReadPlan } from "@/api/routes/@shared/plan-access";
import { SuccessResponse, ErrorResponse } from "@/api/schemas/common.schema";
import { PlanDetailSchema } from "@/api/schemas/plan.schema";

export const planOneGetRoute = new Elysia().use(JWT()).get(
  "/one",
  async ({ query, set, jwt, headers }) => {
    const viewerId = await getOptionalUserId(jwt, getBearerToken(headers));

    const plan = await db
      .select({
        id: planTable.id,
        title: planTable.title,
        description: planTable.description,
        imageUrl: planTable.imageUrl,
        speed: planTable.speed,
        type: planTable.type,
        status: planTable.status,
        routeUrl: planTable.routeUrl,
        whatsappGroupUrl: planTable.whatsappGroupUrl,
        wikilocUrl: planTable.wikilocUrl,
        stravaUrl: planTable.stravaUrl,
        startDate: planTable.startDate,
        startTime: planTable.startTime,
        creatorId: planTable.creatorId,
        createdAt: planTable.createdAt,
        updatedAt: planTable.updatedAt,
        isPrivate: planTable.isPrivate,
      })
      .from(planTable)
      .where(eq(planTable.id, query.id))
      .limit(1)
      .execute();

    if (!plan.length) {
      set.status = 404;
      return { success: false, message: "NOT_FOUND" };
    }

    const allowed = await canReadPlan({
      plan: plan[0],
      viewerId,
    });
    if (!allowed) {
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
