import { count, desc, ilike, sql, type SQL } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { organizationMemberTable, organizationTable } from "@/db/schema";
import { AdminOrganizationsResponseSchema } from "@/api/schemas/admin-organization.schema";
import { SuccessResponse } from "@/api/schemas/common.schema";

const DEFAULT_PAGE_SIZE = 15;
const MAX_PAGE_SIZE = 100;

export const adminOrganizationsGetRoute = new Elysia().get(
  "/organizations",
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
      conditions.push(ilike(organizationTable.name, `%${search}%`));
    }
    const where = conditions.length ? conditions[0] : undefined;

    // Correlated subquery — same idiom as `totalMountainsSql` in
    // admin.challenges.get.ts. Avoids dragging the whole member table into
    // the result set just to compute one number per org.
    const memberCountSql = sql<number>`(
      SELECT COUNT(*)::int FROM ${organizationMemberTable}
      WHERE ${organizationMemberTable.organizationId} = ${organizationTable.id}
    )`;

    const [countResult, rows] = await Promise.all([
      db.select({ total: count() }).from(organizationTable).where(where),
      db
        .select({
          id: organizationTable.id,
          name: organizationTable.name,
          imageUrl: organizationTable.imageUrl,
          memberCount: memberCountSql,
          createdAt: organizationTable.createdAt,
        })
        .from(organizationTable)
        .where(where)
        .orderBy(desc(organizationTable.createdAt))
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
    }),
    response: SuccessResponse(AdminOrganizationsResponseSchema),
  },
);
