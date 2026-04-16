import { and, desc, eq, ilike, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { mountainTable, summitHasUsersTable, summitTable } from "@/db/schema";
import { getUserFromRequest } from "@/api/routes/@shared/auth";
import { SuccessResponse } from "@/api/schemas/common.schema";
import { UserSummitsAllResponseSchema } from "@/api/schemas/user.schema";

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

export const userSummitsAllGetRoute = new Elysia().get(
  "/summits/all",
  async ({ request, query }) => {
    const user = getUserFromRequest(request);
    const userId = user.id;

    const page = query.page ?? 1;
    const pageSize = Math.min(query.limit ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const offset = (page - 1) * pageSize;
    const search = query.q?.trim() ?? "";

    const whereCondition = and(
      eq(summitHasUsersTable.userId, userId),
      search.length > 0 ? ilike(mountainTable.name, `%${search}%`) : undefined,
    );

    const pageQuery = db
      .select({
        summitId: summitTable.id,
        summitedAt: summitTable.summitedAt,
        summitedValidated: summitTable.validated,
        mountainName: mountainTable.name,
        mountainSlug: mountainTable.slug,
        mountainImageUrl: mountainTable.imageUrl,
        mountainHeight: mountainTable.height,
        mountainEssential: mountainTable.essential,
      })
      .from(summitHasUsersTable)
      .innerJoin(summitTable, eq(summitHasUsersTable.summitId, summitTable.id))
      .innerJoin(mountainTable, eq(summitTable.mountainId, mountainTable.id))
      .where(whereCondition)
      .orderBy(
        query.sort === "height"
          ? desc(mountainTable.height)
          : desc(summitTable.summitedAt),
        desc(summitTable.createdAt),
      )
      .limit(pageSize)
      .offset(offset);

    const aggregatesQuery = db
      .select({
        totalSummits: sql<number>`COUNT(*)`,
        uniquePeaksCount: sql<number>`COUNT(DISTINCT ${mountainTable.id})`,
        essentialPeaksCount: sql<number>`COUNT(DISTINCT CASE WHEN ${mountainTable.essential} THEN ${mountainTable.id} ELSE NULL END)`,
        score: sql<number>`COALESCE(SUM(CASE WHEN ${summitTable.validated} THEN (CAST(${mountainTable.height} AS FLOAT) / 10) * CASE WHEN ${mountainTable.essential} THEN 2 ELSE 1 END ELSE 0 END), 0)`,
      })
      .from(summitHasUsersTable)
      .innerJoin(summitTable, eq(summitHasUsersTable.summitId, summitTable.id))
      .innerJoin(mountainTable, eq(summitTable.mountainId, mountainTable.id))
      .where(whereCondition);

    const [rows, aggregatesResult] = await Promise.all([
      pageQuery,
      aggregatesQuery,
    ]);

    const items = rows.map((row) => ({
      ...row,
      score:
        (parseInt(row.mountainHeight) / 10) * (row.mountainEssential ? 2 : 1),
    }));

    const agg = aggregatesResult[0];
    const totalItems = Number(agg?.totalSummits ?? 0);
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    return {
      success: true,
      message: {
        items,
        aggregates: {
          score: Number(agg?.score ?? 0),
          uniquePeaksCount: Number(agg?.uniquePeaksCount ?? 0),
          essentialPeaksCount: Number(agg?.essentialPeaksCount ?? 0),
          totalSummits: Number(agg?.totalSummits ?? 0),
        },
        pagination: {
          page,
          pageSize,
          totalItems,
          totalPages,
          hasMore: page * pageSize < totalItems,
        },
      },
    };
  },
  {
    query: t.Object({
      page: t.Optional(t.Numeric({ minimum: 1 })),
      limit: t.Optional(t.Numeric({ minimum: 1, maximum: MAX_PAGE_SIZE })),
      q: t.Optional(t.String({ maxLength: 100 })),
      sort: t.Optional(t.Union([t.Literal("recent"), t.Literal("height")])),
    }),
    response: SuccessResponse(UserSummitsAllResponseSchema),
  },
);
