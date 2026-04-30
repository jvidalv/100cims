import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { mountainTable, summitTable, userTable } from "@/db/schema";
import { creatorNameConcat } from "@/api/routes/@shared/sql-helpers";
import { AdminMountainsResponseSchema } from "@/api/schemas/admin-mountain.schema";
import { SuccessResponse } from "@/api/schemas/common.schema";

const DEFAULT_PAGE_SIZE = 15;
const MAX_PAGE_SIZE = 100;

export const adminMountainsGetRoute = new Elysia().get(
  "/mountains",
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
        ilike(mountainTable.location, pattern),
      );
      if (cond) conditions.push(cond);
    }

    const where = conditions.length ? and(...conditions) : undefined;

    const totalSummitsSql = sql<number>`(
      SELECT COUNT(*)::int FROM ${summitTable}
      WHERE ${summitTable.mountainId} = ${mountainTable.id}
    )`;

    const orderBy = (() => {
      switch (query.sort) {
        case "createdAt_asc":
          return [asc(mountainTable.createdAt)];
        case "summits_desc":
          return [desc(totalSummitsSql), desc(mountainTable.createdAt)];
        case "summits_asc":
          return [asc(totalSummitsSql), desc(mountainTable.createdAt)];
        default:
          return [desc(mountainTable.createdAt)];
      }
    })();

    const [countResult, rows] = await Promise.all([
      db.select({ total: count() }).from(mountainTable).where(where),
      db
        .select({
          id: mountainTable.id,
          name: mountainTable.name,
          slug: mountainTable.slug,
          location: mountainTable.location,
          essential: mountainTable.essential,
          height: mountainTable.height,
          imageUrl: mountainTable.imageUrl,
          creatorId: mountainTable.creatorId,
          creatorName: creatorNameConcat(),
          createdAt: mountainTable.createdAt,
          avgFamilyFriendly: mountainTable.avgFamilyFriendly,
          familyRatingCount: mountainTable.familyRatingCount,
          avgDogFriendly: mountainTable.avgDogFriendly,
          dogRatingCount: mountainTable.dogRatingCount,
          avgDifficulty: mountainTable.avgDifficulty,
          difficultyRatingCount: mountainTable.difficultyRatingCount,
          totalSummits: totalSummitsSql,
        })
        .from(mountainTable)
        .leftJoin(userTable, eq(mountainTable.creatorId, userTable.id))
        .where(where)
        .orderBy(...orderBy)
        .limit(pageSize)
        .offset(offset),
    ]);

    const total = countResult[0].total;

    return {
      success: true,
      message: {
        items: rows.map(({ creatorId, ...rest }) => ({
          ...rest,
          isOfficial: creatorId === null,
        })),
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
      sort: t.Optional(t.String()),
    }),
    response: SuccessResponse(AdminMountainsResponseSchema),
  },
);
