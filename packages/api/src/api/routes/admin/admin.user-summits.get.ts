import { count, desc, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { mountainTable, summitHasUsersTable, summitTable } from "@/db/schema";
import { AdminSummitsResponseSchema } from "@/api/schemas/admin.schema";
import { SuccessResponse } from "@/api/schemas/common.schema";

const DEFAULT_PAGE_SIZE = 15;
const MAX_PAGE_SIZE = 100;

export const adminUserSummitsGetRoute = new Elysia().get(
  "/users/:id/summits",
  async ({ params, query }) => {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, query.pageSize ?? DEFAULT_PAGE_SIZE),
    );
    const offset = (page - 1) * pageSize;

    const [{ total }] = await db
      .select({ total: count() })
      .from(summitHasUsersTable)
      .where(eq(summitHasUsersTable.userId, params.id));

    const items = await db
      .select({
        summitId: summitTable.id,
        summitedAt: summitTable.summitedAt,
        validated: summitTable.validated,
        imageUrl: summitTable.imageUrl,
        mountainId: mountainTable.id,
        mountainName: mountainTable.name,
        mountainSlug: mountainTable.slug,
        mountainHeight: mountainTable.height,
        mountainEssential: mountainTable.essential,
      })
      .from(summitHasUsersTable)
      .innerJoin(summitTable, eq(summitHasUsersTable.summitId, summitTable.id))
      .innerJoin(mountainTable, eq(summitTable.mountainId, mountainTable.id))
      .where(eq(summitHasUsersTable.userId, params.id))
      .orderBy(desc(summitTable.summitedAt), desc(summitTable.createdAt))
      .limit(pageSize)
      .offset(offset);

    return {
      success: true,
      message: {
        items,
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  },
  {
    params: t.Object({ id: t.String() }),
    query: t.Object({
      page: t.Optional(t.Number()),
      pageSize: t.Optional(t.Number()),
    }),
    response: SuccessResponse(AdminSummitsResponseSchema),
  },
);
