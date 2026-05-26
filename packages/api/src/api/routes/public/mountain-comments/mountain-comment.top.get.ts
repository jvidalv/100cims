import { and, desc, eq, gte, inArray, isNull, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import {
  mountainCommentTable,
  mountainCommentUpvoteTable,
  summitTable,
  userTable,
} from "@/db/schema";
import { JWT } from "@/api/routes/@shared/jwt";
import {
  getBearerToken,
  getOptionalUserId,
} from "@/api/routes/@shared/optional-auth";
import { SuccessResponse } from "@/api/schemas/common.schema";
import { MountainTopCommentsResponseSchema } from "@/api/schemas/mountain-comment.schema";

// Top-level comments with >= 3 upvotes, top 3 by upvote count (then createdAt DESC).
// No replies, no pagination. Used on the mountain detail page digest.
const MIN_UPVOTES = 3;
const MAX_RESULTS = 3;

export const mountainCommentTopGetRoute = new Elysia().use(JWT()).get(
  "/top",
  async ({ query, jwt, headers }) => {
    const viewerId = await getOptionalUserId(jwt, getBearerToken(headers));

    const rows = await db
      .select({
        id: mountainCommentTable.id,
        mountainId: mountainCommentTable.mountainId,
        parentCommentId: mountainCommentTable.parentCommentId,
        body: mountainCommentTable.body,
        images: mountainCommentTable.images,
        upvoteCount: mountainCommentTable.upvoteCount,
        createdAt: mountainCommentTable.createdAt,
        updatedAt: mountainCommentTable.updatedAt,
        user: {
          id: userTable.id,
          username: userTable.username,
          firstName: userTable.firstName,
          lastName: userTable.lastName,
          imageUrl: userTable.imageUrl,
          hasSummitedThisMountain: sql<boolean>`EXISTS (
            SELECT 1 FROM ${summitTable}
            WHERE ${summitTable.userId} = ${mountainCommentTable.userId}
              AND ${summitTable.mountainId} = ${mountainCommentTable.mountainId}
          )`,
        },
      })
      .from(mountainCommentTable)
      .innerJoin(userTable, eq(mountainCommentTable.userId, userTable.id))
      .where(
        and(
          eq(mountainCommentTable.mountainId, query.mountainId),
          isNull(mountainCommentTable.parentCommentId),
          gte(mountainCommentTable.upvoteCount, MIN_UPVOTES),
        ),
      )
      .orderBy(
        desc(mountainCommentTable.upvoteCount),
        desc(mountainCommentTable.createdAt),
      )
      .limit(MAX_RESULTS);

    // Total comments on this mountain (top-level + replies) — drives the
    // "All comments (N)" CTA on the mountain detail page.
    const [totalRow] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(mountainCommentTable)
      .where(eq(mountainCommentTable.mountainId, query.mountainId));
    const total = totalRow?.count ?? 0;

    if (rows.length === 0) {
      return { success: true, message: { items: [], total } };
    }

    let upvotedSet = new Set<string>();
    if (viewerId) {
      const upvotedRows = await db
        .select({ commentId: mountainCommentUpvoteTable.commentId })
        .from(mountainCommentUpvoteTable)
        .where(
          and(
            eq(mountainCommentUpvoteTable.userId, viewerId),
            inArray(
              mountainCommentUpvoteTable.commentId,
              rows.map((r) => r.id),
            ),
          ),
        );
      upvotedSet = new Set(upvotedRows.map((u) => u.commentId));
    }

    return {
      success: true,
      message: {
        items: rows.map((r) => ({
          ...r,
          viewerHasUpvoted: upvotedSet.has(r.id),
        })),
        total,
      },
    };
  },
  {
    query: t.Object({ mountainId: t.String() }),
    response: SuccessResponse(MountainTopCommentsResponseSchema),
  },
);
