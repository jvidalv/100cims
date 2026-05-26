import { and, asc, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { mountainCommentTable, mountainTable, userTable } from "@/db/schema";
import { AdminMountainCommentsListResponseSchema } from "@/api/schemas/admin-mountain-comment.schema";
import { SuccessResponse } from "@/api/schemas/common.schema";

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

/**
 * Cross-mountain admin listing of every comment. Mirrors the shape of
 * /admin/mountains: pagination + free-text filter on body, sortable by
 * upvotes or recency. Embeds mountain + author so the table renders without
 * follow-up fetches.
 */
export const adminMountainCommentsListGetRoute = new Elysia().get(
  "/mountain-comments",
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
        ilike(mountainCommentTable.body, pattern),
        ilike(mountainTable.name, pattern),
      );
      if (cond) conditions.push(cond);
    }
    const where = conditions.length ? and(...conditions) : undefined;

    const orderBy = (() => {
      switch (query.sort) {
        case "createdAt_asc":
          return [asc(mountainCommentTable.createdAt)];
        case "upvotes_desc":
          return [
            desc(mountainCommentTable.upvoteCount),
            desc(mountainCommentTable.createdAt),
          ];
        default:
          return [desc(mountainCommentTable.createdAt)];
      }
    })();

    const [countResult, rows] = await Promise.all([
      db
        .select({ total: count() })
        .from(mountainCommentTable)
        .innerJoin(
          mountainTable,
          eq(mountainCommentTable.mountainId, mountainTable.id),
        )
        .innerJoin(userTable, eq(mountainCommentTable.userId, userTable.id))
        .where(where),
      db
        .select({
          id: mountainCommentTable.id,
          body: mountainCommentTable.body,
          images: mountainCommentTable.images,
          upvoteCount: mountainCommentTable.upvoteCount,
          parentCommentId: mountainCommentTable.parentCommentId,
          createdAt: mountainCommentTable.createdAt,
          mountain: {
            id: mountainTable.id,
            name: mountainTable.name,
            slug: mountainTable.slug,
            imageUrl: mountainTable.imageUrl,
          },
          user: {
            id: userTable.id,
            username: userTable.username,
            firstName: userTable.firstName,
            lastName: userTable.lastName,
            imageUrl: userTable.imageUrl,
            email: userTable.email,
          },
        })
        .from(mountainCommentTable)
        .innerJoin(
          mountainTable,
          eq(mountainCommentTable.mountainId, mountainTable.id),
        )
        .innerJoin(userTable, eq(mountainCommentTable.userId, userTable.id))
        .where(where)
        .orderBy(...orderBy)
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
      sort: t.Optional(t.String()),
    }),
    response: SuccessResponse(AdminMountainCommentsListResponseSchema),
  },
);
