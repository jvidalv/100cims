import { and, asc, count, desc, eq, inArray } from "drizzle-orm";
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
import {
  assemblePlanOrganization,
  planOrganizationSelection,
  planParticipantsOrderBy,
} from "@/api/routes/@shared/plan-organization";
import { SuccessResponse } from "@/api/schemas/common.schema";
import { PaginatedPlansSchema } from "@/api/schemas/plan.schema";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

export const planAllPaginatedGetRoute = new Elysia().use(JWT()).get(
  "/all-paginated",
  async ({ query, jwt, headers }) => {
    const viewerId = await getOptionalUserId(jwt, getBearerToken(headers));

    const page = query?.page ?? 1;
    const pageSize = Math.min(query?.limit ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const offset = (page - 1) * pageSize;

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
      featured: planTable.featured,
      // Org-on-plan LEFT JOIN columns — collapsed via
      // `assemblePlanOrganization` per row below.
      ...planOrganizationSelection,
    };

    const buildBase = () => {
      const base = query?.userId
        ? db
            .select(selection)
            .from(planTable)
            .innerJoin(
              planHasUsersTable,
              eq(planHasUsersTable.planId, planTable.id),
            )
        : db.select(selection).from(planTable);
      return base
        .leftJoin(
          organizationTable,
          eq(planTable.organizationId, organizationTable.id),
        )
        .$dynamic();
    };

    const buildCountBase = () =>
      query?.userId
        ? db
            .select({ count: count() })
            .from(planTable)
            .innerJoin(
              planHasUsersTable,
              eq(planHasUsersTable.planId, planTable.id),
            )
            .$dynamic()
        : db.select({ count: count() }).from(planTable).$dynamic();

    const whereExpr = filters.length ? and(...filters) : undefined;

    const pageQuery = (whereExpr ? buildBase().where(whereExpr) : buildBase())
      .orderBy(...orderBy)
      .limit(pageSize)
      .offset(offset);

    const countQuery = whereExpr
      ? buildCountBase().where(whereExpr)
      : buildCountBase();

    const [plans, countResult] = await Promise.all([pageQuery, countQuery]);

    const planIds = plans.map((p) => p.id);
    const [users, mountains] = await Promise.all([
      planIds.length
        ? db
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
            // Organizers first, joinedAt DESC. Shared helper — see
            // `planParticipantsOrderBy`.
            .orderBy(...planParticipantsOrderBy())
        : Promise.resolve([]),

      planIds.length
        ? db
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
            .where(inArray(planHasMountainsTable.planId, planIds))
        : Promise.resolve([]),
    ]);

    const usersByPlan = new Map<
      string,
      {
        id: string;
        firstName: string | null;
        lastName: string | null;
        imageUrl: string | null;
        willBringDogs: boolean;
        role: "member" | "organizer";
      }[]
    >();
    for (const u of users) {
      if (!u.planId) continue;
      const list = usersByPlan.get(u.planId) ?? [];
      list.push({
        id: u.userId,
        firstName: u.firstName,
        lastName: u.lastName,
        imageUrl: u.imageUrl,
        willBringDogs: u.willBringDogs,
        role: u.role,
      });
      usersByPlan.set(u.planId, list);
    }

    const mountainsByPlan = new Map<
      string,
      {
        id: string;
        name: string;
        slug: string;
        imageUrl: string | null;
        location: string;
        height: string;
      }[]
    >();
    for (const m of mountains) {
      if (!m.planId) continue;
      const list = mountainsByPlan.get(m.planId) ?? [];
      list.push({
        id: m.mountainId,
        name: m.name,
        slug: m.slug,
        imageUrl: m.imageUrl,
        location: m.location,
        height: m.height,
      });
      mountainsByPlan.set(m.planId, list);
    }

    const items = plans.map((plan) => {
      const {
        organizationId,
        organizationName,
        organizationImageUrl,
        ...planFields
      } = plan;
      return {
        ...planFields,
        users: usersByPlan.get(plan.id) ?? [],
        mountains: mountainsByPlan.get(plan.id) ?? [],
        organization: assemblePlanOrganization({
          organizationId,
          organizationName,
          organizationImageUrl,
        }),
      };
    });

    const totalItems = Number(countResult[0]?.count ?? 0);
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    return {
      success: true,
      message: {
        items,
        pagination: {
          page,
          pageSize,
          totalItems,
          totalPages,
          hasMore: page < totalPages,
        },
      },
    };
  },
  {
    query: t.Optional(
      t.Object({
        page: t.Optional(t.Number()),
        limit: t.Optional(t.Number()),
        status: t.Optional(
          t.Union([
            t.Literal("open"),
            t.Literal("canceled"),
            t.Literal("completed"),
          ]),
        ),
        creatorId: t.Optional(t.String()),
        userId: t.Optional(t.String()),
        sort: t.Optional(t.Literal("upcoming")),
        challengeId: t.Optional(t.String()),
      }),
    ),
    response: SuccessResponse(PaginatedPlansSchema),
  },
);
