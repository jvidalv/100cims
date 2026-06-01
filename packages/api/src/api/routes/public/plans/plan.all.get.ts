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
  organizationTable,
} from "@/db/schema";
import { JWT } from "@/api/routes/@shared/jwt";
import {
  getBearerToken,
  getOptionalUserId,
} from "@/api/routes/@shared/optional-auth";
import { planVisibilitySql } from "@/api/routes/@shared/plan-access";
import { planFutureOnlySql } from "@/api/routes/@shared/plan-future-only";
import {
  assemblePlanOrganization,
  planOrganizationSelection,
  planParticipantsOrderBy,
} from "@/api/routes/@shared/plan-organization";
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
      planFutureOnlySql(query?.futureOnly),
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
      featured: planTable.featured,
      // Org-on-plan LEFT JOIN columns — collapsed into the nested
      // `organization` field per-row below.
      ...planOrganizationSelection,
    };

    const baseFromUserJoin = query?.userId
      ? db
          .select(selection)
          .from(planTable)
          .innerJoin(
            planHasUsersTable,
            eq(planHasUsersTable.planId, planTable.id),
          )
      : db.select(selection).from(planTable);

    const baseQuery = baseFromUserJoin
      .leftJoin(
        organizationTable,
        eq(planTable.organizationId, organizationTable.id),
      )
      .$dynamic();

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
          role: planHasUsersTable.role,
        })
        .from(planHasUsersTable)
        .innerJoin(userTable, eq(planHasUsersTable.userId, userTable.id))
        .where(inArray(planHasUsersTable.planId, planIds))
        // Organizers first, joinedAt DESC within each role. Shared with
        // every other plan-list endpoint via `planParticipantsOrderBy`.
        // The per-plan `.filter` below preserves this row order.
        .orderBy(...planParticipantsOrderBy()),

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

    const plansWithRelations = plans.map((plan) => {
      const {
        organizationId,
        organizationName,
        organizationImageUrl,
        ...planFields
      } = plan;
      return {
        ...planFields,
        users: users
          .filter((u) => u.planId === plan.id)
          .map(
            ({
              userId,
              firstName,
              lastName,
              imageUrl,
              willBringDogs,
              role,
            }) => ({
              id: userId,
              firstName,
              lastName,
              imageUrl,
              willBringDogs,
              role,
            }),
          ),
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
        organization: assemblePlanOrganization({
          organizationId,
          organizationName,
          organizationImageUrl,
        }),
      };
    });

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
        futureOnly: t.Optional(t.Boolean()),
      }),
    ),
    response: SuccessResponse(PlansArraySchema),
  },
);
