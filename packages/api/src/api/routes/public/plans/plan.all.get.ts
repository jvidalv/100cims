/**
 * @deprecated Returns all matching plans in one shot (capped only by an
 * optional `limit`). Kept for old mobile clients still in the wild. New
 * mobile builds use GET /api/public/plans/all-paginated.
 */
import { and, asc, desc, eq, inArray } from "drizzle-orm";
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
import { planVisibilitySql } from "@/api/routes/@shared/plan-access";
import { SuccessResponse } from "@/api/schemas/common.schema";
import { PlansArraySchema } from "@/api/schemas/plan.schema";
import { PlanStatusSchema } from "@/api/schemas/enums";

export const planAllGetRoute = new Elysia().use(JWT()).get(
  "/all",
  async ({ query, jwt, headers }) => {
    const viewerId = await getOptionalUserId(jwt, getBearerToken(headers));

    const filters = [
      query?.status ? eq(planTable.status, query.status) : undefined,
      query?.creatorId ? eq(planTable.creatorId, query.creatorId) : undefined,
      query?.challengeId
        ? eq(planTable.challengeId, query.challengeId)
        : undefined,
      query?.userId ? eq(planHasUsersTable.userId, query.userId) : undefined,
      planVisibilitySql(viewerId),
    ].filter(Boolean);

    const orderBy =
      query?.sort === "upcoming"
        ? [asc(planTable.startDate)]
        : [desc(planTable.createdAt)];

    const selection = {
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
      challengeId: planTable.challengeId,
      isPrivate: planTable.isPrivate,
    };

    const baseQuery = query?.userId
      ? db
          .select(selection)
          .from(planTable)
          .innerJoin(
            planHasUsersTable,
            eq(planHasUsersTable.planId, planTable.id),
          )
          .$dynamic()
      : db.select(selection).from(planTable).$dynamic();

    const filtered = filters.length
      ? baseQuery.where(and(...filters))
      : baseQuery;

    const ordered = filtered.orderBy(...orderBy);

    const plans = await (
      query?.limit ? ordered.limit(query.limit) : ordered
    ).execute();

    const planIds = plans.map((p) => p.id);
    const [users, mountains] = await Promise.all([
      db
        .select({
          planId: planHasUsersTable.planId,
          userId: userTable.id,
          firstName: userTable.firstName,
          lastName: userTable.lastName,
          imageUrl: userTable.imageUrl,
          willBringDogs: planHasUsersTable.willBringDogs,
        })
        .from(planHasUsersTable)
        .innerJoin(userTable, eq(planHasUsersTable.userId, userTable.id))
        .where(inArray(planHasUsersTable.planId, planIds)),

      db
        .select({
          planId: planHasMountainsTable.planId,
          mountainId: mountainTable.id,
          name: mountainTable.name,
          slug: mountainTable.slug,
          imageUrl: mountainTable.imageUrl,
          location: mountainTable.location,
          height: mountainTable.height,
        })
        .from(planHasMountainsTable)
        .innerJoin(
          mountainTable,
          eq(planHasMountainsTable.mountainId, mountainTable.id),
        )
        .where(inArray(planHasMountainsTable.planId, planIds)),
    ]);

    const plansWithRelations = plans.map((plan) => ({
      ...plan,
      users: users
        .filter((u) => u.planId === plan.id)
        .map(({ userId, firstName, lastName, imageUrl, willBringDogs }) => ({
          id: userId,
          firstName,
          lastName,
          imageUrl,
          willBringDogs,
        })),
      mountains: mountains
        .filter((m) => m.planId === plan.id)
        .map(({ mountainId, name, slug, imageUrl, location, height }) => ({
          id: mountainId,
          name,
          slug,
          imageUrl,
          location,
          height,
        })),
    }));

    return {
      success: true,
      message: plansWithRelations,
    };
  },
  {
    query: t.Optional(
      t.Object({
        status: t.Optional(PlanStatusSchema),
        limit: t.Optional(t.Number()),
        creatorId: t.Optional(t.String()),
        userId: t.Optional(t.String()),
        sort: t.Optional(t.String()),
        challengeId: t.Optional(t.String()),
      }),
    ),
    response: SuccessResponse(PlansArraySchema),
  },
);
