import { and, asc, desc, eq, gt, inArray, lt, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import {
  planTable,
  planHasUsersTable,
  userTable,
  planHasMountainsTable,
  mountainTable,
  userPlanVisitTable,
} from "@/db/schema";
import {
  SuccessResponse,
  SimpleSuccessResponse,
  ErrorResponse,
} from "@/api/schemas/common.schema";
import {
  PlansArraySchema,
  PlanDetailSchema,
  CountResponseSchema,
} from "@/api/schemas/plan.schema";

export const plansRoute = new Elysia({ prefix: "/plans" })
  .get(
    "/all",
    async ({ query }) => {
      // Auto-complete plans older than 2 days

      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      await db
        .update(planTable)
        .set({ status: "completed", updatedAt: new Date() })
        .where(
          and(
            eq(planTable.status, "open"),
            lt(planTable.startDate, twoDaysAgo.toISOString()),
          ),
        );

      const whereConditions = [
        query.status
          ? eq(
              planTable.status,
              query.status as unknown as "open" | "canceled" | "completed",
            )
          : undefined,
        query.creatorId ? eq(planTable.creatorId, query.creatorId) : undefined,
        query.challengeId
          ? eq(planTable.challengeId, query.challengeId)
          : undefined,
      ].filter(Boolean);

      const userFilter = query.userId
        ? eq(planHasUsersTable.userId, query.userId)
        : undefined;

      let baseQuery = db
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
          challengeId: planTable.challengeId, // ✅ expose in result
        })
        .from(planTable)
        .orderBy(
          ...(query.sort === "upcoming"
            ? [asc(planTable.startDate)]
            : [desc(planTable.createdAt)]),
        );

      if (query.userId) {
        // @ts-expect-error -- Must join and filter plans where user is participant
        baseQuery = baseQuery
          .innerJoin(
            planHasUsersTable,
            eq(planHasUsersTable.planId, planTable.id),
          )
          .where(and(...[...whereConditions, userFilter].filter(Boolean)));
      } else if (whereConditions.length > 0) {
        // @ts-expect-error -- Drizzle query builder type narrowing issue
        baseQuery = baseQuery.where(and(...whereConditions));
      }

      if (query.limit) {
        // @ts-expect-error -- Drizzle query builder type narrowing issue
        baseQuery = baseQuery.limit(query.limit);
      }

      const plans = await baseQuery.execute();

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
      query: t.Object({
        status: t.Optional(t.String()),
        limit: t.Optional(t.Number()),
        creatorId: t.Optional(t.String()),
        userId: t.Optional(t.String()),
        sort: t.Optional(t.String()), // "upcoming" or undefined
        challengeId: t.Optional(t.String()), // ✅ new
      }),
      response: SuccessResponse(PlansArraySchema),
    },
  )
  .get(
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
  )
  .get(
    "/count-new",
    async ({ query }) => {
      if (!query.userId) {
        const [{ count }] = await db
          .select({ count: sql<string>`count(*)` })
          .from(planTable)
          .where(eq(planTable.status, "open"));

        return { success: true, count: parseInt(count) };
      }

      const visit = await db
        .select({ lastVisitedAt: userPlanVisitTable.lastVisitedAt })
        .from(userPlanVisitTable)
        .where(eq(userPlanVisitTable.userId, query.userId))
        .limit(1)
        .execute();

      const lastVisited = visit[0]?.lastVisitedAt ?? new Date(0);

      const [{ count }] = await db
        .select({ count: sql<string>`count(*)` })
        .from(planTable)
        .where(
          and(
            eq(planTable.status, "open"),
            gt(planTable.createdAt, lastVisited),
          ),
        );

      return { success: true, count: parseInt(count) };
    },
    {
      query: t.Object({
        userId: t.Optional(t.String()),
      }),
      response: CountResponseSchema,
    },
  )
  .post(
    "/count-new",
    async ({ body }) => {
      await db
        .insert(userPlanVisitTable)
        .values({
          userId: body.userId,
          lastVisitedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: userPlanVisitTable.userId,
          set: { lastVisitedAt: new Date() },
        });

      return { success: true };
    },
    {
      body: t.Object({
        userId: t.String(),
      }),
      response: SimpleSuccessResponse,
    },
  );
