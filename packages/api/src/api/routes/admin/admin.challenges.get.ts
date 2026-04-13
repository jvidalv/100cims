import {
  and,
  count,
  desc,
  eq,
  ilike,
  isNotNull,
  isNull,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import {
  challengeHasMountainTable,
  challengeTable,
  userTable,
} from "@/db/schema";
import { creatorNameConcat } from "@/api/routes/@shared/sql-helpers";
import { AdminChallengesResponseSchema } from "@/api/schemas/admin-challenge.schema";
import { SuccessResponse } from "@/api/schemas/common.schema";

const DEFAULT_PAGE_SIZE = 15;
const MAX_PAGE_SIZE = 100;

export const adminChallengesGetRoute = new Elysia().get(
  "/challenges",
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
        ilike(challengeTable.name, pattern),
        ilike(challengeTable.slug, pattern),
      );
      if (cond) conditions.push(cond);
    }
    if (query.kind === "official") {
      conditions.push(isNull(challengeTable.creatorId));
    } else if (query.kind === "community") {
      conditions.push(isNotNull(challengeTable.creatorId));
    }

    const where = conditions.length ? and(...conditions) : undefined;

    const totalMountainsSql = sql<number>`(
      SELECT COUNT(*)::int FROM ${challengeHasMountainTable}
      WHERE ${challengeHasMountainTable.challengeId} = ${challengeTable.id}
    )`;

    const [countResult, rows] = await Promise.all([
      db.select({ total: count() }).from(challengeTable).where(where),
      db
        .select({
          id: challengeTable.id,
          name: challengeTable.name,
          slug: challengeTable.slug,
          country: challengeTable.country,
          emoji: challengeTable.emoji,
          imageUrl: challengeTable.imageUrl,
          isPublic: challengeTable.isPublic,
          creatorId: challengeTable.creatorId,
          creatorName: creatorNameConcat(),
          totalMountains: totalMountainsSql,
          createdAt: challengeTable.createdAt,
        })
        .from(challengeTable)
        .leftJoin(userTable, eq(challengeTable.creatorId, userTable.id))
        .where(where)
        .orderBy(desc(challengeTable.createdAt))
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
      kind: t.Optional(t.String()),
    }),
    response: SuccessResponse(AdminChallengesResponseSchema),
  },
);
