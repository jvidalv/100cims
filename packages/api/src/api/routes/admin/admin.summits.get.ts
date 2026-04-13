import {
  and,
  count,
  countDistinct,
  desc,
  eq,
  ilike,
  or,
  type SQL,
} from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import {
  mountainTable,
  summitHasUsersTable,
  summitTable,
  userTable,
} from "@/db/schema";
import { AdminSummitListResponseSchema } from "@/api/schemas/admin.schema";
import { SuccessResponse } from "@/api/schemas/common.schema";

const DEFAULT_PAGE_SIZE = 15;
const MAX_PAGE_SIZE = 100;

export const adminSummitsGetRoute = new Elysia().get(
  "/summits",
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
        ilike(mountainTable.name, pattern),
        ilike(userTable.username, pattern),
        ilike(userTable.firstName, pattern),
        ilike(userTable.lastName, pattern),
      );
      if (cond) conditions.push(cond);
    }
    if (query.validated === "true") {
      conditions.push(eq(summitTable.validated, true));
    } else if (query.validated === "false") {
      conditions.push(eq(summitTable.validated, false));
    }
    if (query.mountainId) {
      conditions.push(eq(summitTable.mountainId, query.mountainId));
    }
    if (query.userId) {
      conditions.push(eq(summitTable.userId, query.userId));
    }

    const where = conditions.length ? and(...conditions) : undefined;

    const countQuery = search
      ? db
          .select({ total: count() })
          .from(summitTable)
          .leftJoin(mountainTable, eq(summitTable.mountainId, mountainTable.id))
          .leftJoin(userTable, eq(summitTable.userId, userTable.id))
          .where(where)
      : db.select({ total: count() }).from(summitTable).where(where);

    const [countResult, rows] = await Promise.all([
      countQuery,
      db
        .select({
          id: summitTable.id,
          imageUrl: summitTable.imageUrl,
          summitedAt: summitTable.summitedAt,
          validated: summitTable.validated,
          createdAt: summitTable.createdAt,
          mountainId: mountainTable.id,
          mountainName: mountainTable.name,
          mountainSlug: mountainTable.slug,
          userId: userTable.id,
          userUsername: userTable.username,
          userFirstName: userTable.firstName,
          userLastName: userTable.lastName,
          userImageUrl: userTable.imageUrl,
          relatedUsersCount: countDistinct(summitHasUsersTable.id),
        })
        .from(summitTable)
        .leftJoin(mountainTable, eq(summitTable.mountainId, mountainTable.id))
        .leftJoin(userTable, eq(summitTable.userId, userTable.id))
        .leftJoin(
          summitHasUsersTable,
          eq(summitHasUsersTable.summitId, summitTable.id),
        )
        .where(where)
        .groupBy(summitTable.id, mountainTable.id, userTable.id)
        .orderBy(desc(summitTable.summitedAt), desc(summitTable.createdAt))
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
      },
    };
  },
  {
    query: t.Object({
      page: t.Optional(t.Number()),
      pageSize: t.Optional(t.Number()),
      q: t.Optional(t.String()),
      validated: t.Optional(t.String()),
      mountainId: t.Optional(t.String()),
      userId: t.Optional(t.String()),
    }),
    response: SuccessResponse(AdminSummitListResponseSchema),
  },
);
