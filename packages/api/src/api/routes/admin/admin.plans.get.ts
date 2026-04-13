import { and, count, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import {
  challengeTable,
  planHasMountainsTable,
  planHasUsersTable,
  planTable,
  userTable,
} from "@/db/schema";
import {
  AdminPlansResponseSchema,
  PLAN_SPEEDS,
  PLAN_STATUSES,
  type PlanSpeed,
  type PlanStatus,
} from "@/api/schemas/admin.schema";
import { SuccessResponse } from "@/api/schemas/common.schema";

const DEFAULT_PAGE_SIZE = 15;
const MAX_PAGE_SIZE = 100;
const isStatus = (s: string): s is PlanStatus =>
  (PLAN_STATUSES as readonly string[]).includes(s);
const isSpeed = (s: string): s is PlanSpeed =>
  (PLAN_SPEEDS as readonly string[]).includes(s);

export const adminPlansGetRoute = new Elysia().get(
  "/plans",
  async ({ query }) => {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, query.pageSize ?? DEFAULT_PAGE_SIZE),
    );
    const offset = (page - 1) * pageSize;

    const conditions: SQL[] = [];
    const search = query.q?.trim();
    if (search) {
      const pattern = `%${search}%`;
      const cond = or(
        ilike(planTable.title, pattern),
        ilike(userTable.username, pattern),
        ilike(userTable.firstName, pattern),
        ilike(userTable.lastName, pattern),
      );
      if (cond) conditions.push(cond);
    }
    const statusFilter = query.status;
    if (statusFilter && isStatus(statusFilter))
      conditions.push(eq(planTable.status, statusFilter));
    const speedFilter = query.speed;
    if (speedFilter && isSpeed(speedFilter))
      conditions.push(eq(planTable.speed, speedFilter));

    const where = conditions.length ? and(...conditions) : undefined;

    const countQuery = search
      ? db
          .select({ total: count() })
          .from(planTable)
          .leftJoin(userTable, eq(planTable.creatorId, userTable.id))
          .where(where)
      : db.select({ total: count() }).from(planTable).where(where);

    const [countResult, rows] = await Promise.all([
      countQuery,
      db
        .select({
          id: planTable.id,
          title: planTable.title,
          description: planTable.description,
          imageUrl: planTable.imageUrl,
          startDate: planTable.startDate,
          speed: planTable.speed,
          status: planTable.status,
          createdAt: planTable.createdAt,
          creatorId: planTable.creatorId,
          creatorUsername: userTable.username,
          creatorFirstName: userTable.firstName,
          creatorLastName: userTable.lastName,
          creatorImageUrl: userTable.imageUrl,
          challengeId: challengeTable.id,
          challengeName: challengeTable.name,
          participantsCount: sql<number>`(SELECT COUNT(*)::int FROM ${planHasUsersTable} WHERE ${planHasUsersTable.planId} = ${planTable.id})`,
          mountainsCount: sql<number>`(SELECT COUNT(*)::int FROM ${planHasMountainsTable} WHERE ${planHasMountainsTable.planId} = ${planTable.id})`,
        })
        .from(planTable)
        .leftJoin(userTable, eq(planTable.creatorId, userTable.id))
        .leftJoin(challengeTable, eq(planTable.challengeId, challengeTable.id))
        .where(where)
        .orderBy(desc(planTable.createdAt))
        .limit(pageSize)
        .offset(offset),
    ]);

    const total = countResult[0].total;

    return {
      success: true,
      message: {
        items: rows,
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
        facets: { statuses: [...PLAN_STATUSES], speeds: [...PLAN_SPEEDS] },
      },
    };
  },
  {
    query: t.Object({
      page: t.Optional(t.Number()),
      pageSize: t.Optional(t.Number()),
      q: t.Optional(t.String()),
      status: t.Optional(t.String()),
      speed: t.Optional(t.String()),
    }),
    response: SuccessResponse(AdminPlansResponseSchema),
  },
);
