import {
  and,
  asc,
  desc,
  eq,
  exists,
  gt,
  ilike,
  inArray,
  isNull,
  lt,
  or,
  sql,
} from "drizzle-orm";
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
import { MountainCommentsPageSchema } from "@/api/schemas/mountain-comment.schema";

// Cursor format: base64url JSON.
// - For sort=newest/oldest: { createdAt (ISO), id }
// - For sort=top: { upvoteCount, createdAt (ISO), id }
// Malformed cursors start from the beginning.
type NewestOldestCursor = { createdAt: string; id: string };
type TopCursor = { upvoteCount: number; createdAt: string; id: string };
type Cursor = NewestOldestCursor | TopCursor;

type SortMode = "newest" | "oldest" | "top";

const encodeCursor = (c: Cursor): string =>
  Buffer.from(JSON.stringify(c), "utf8").toString("base64url");

const decodeCursor = (raw: string | undefined): Cursor | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(
      Buffer.from(raw, "base64url").toString("utf8"),
    ) as unknown;
    if (typeof parsed !== "object" || parsed === null) return null;
    if (
      "createdAt" in parsed &&
      "id" in parsed &&
      typeof (parsed as NewestOldestCursor).createdAt === "string" &&
      typeof (parsed as NewestOldestCursor).id === "string"
    ) {
      return parsed as Cursor;
    }
  } catch {
    /* ignore */
  }
  return null;
};

// `sql` helper builds the LEFT JOIN-free "has summited" check using EXISTS.
const summitedExpr = sql<boolean>`EXISTS (
  SELECT 1 FROM ${summitTable}
  WHERE ${summitTable.userId} = ${mountainCommentTable.userId}
    AND ${summitTable.mountainId} = ${mountainCommentTable.mountainId}
)`;

export const mountainCommentListGetRoute = new Elysia().use(JWT()).get(
  "/list",
  async ({ query, jwt, headers }) => {
    const viewerId = await getOptionalUserId(jwt, getBearerToken(headers));
    const limit = Math.min(Math.max(query.limit ?? 20, 1), 50);
    const cursor = decodeCursor(query.cursor);
    const sort: SortMode = query.sort ?? "newest";
    const q = query.q?.trim() ?? "";
    const onlySummiters = query.onlySummiters === true;
    const searchMode = q.length > 0;

    const selectCols = {
      id: mountainCommentTable.id,
      mountainId: mountainCommentTable.mountainId,
      parentCommentId: mountainCommentTable.parentCommentId,
      body: mountainCommentTable.body,
      upvoteCount: mountainCommentTable.upvoteCount,
      createdAt: mountainCommentTable.createdAt,
      updatedAt: mountainCommentTable.updatedAt,
      user: {
        id: userTable.id,
        username: userTable.username,
        firstName: userTable.firstName,
        lastName: userTable.lastName,
        imageUrl: userTable.imageUrl,
        hasSummitedThisMountain: summitedExpr,
      },
    };

    // Per-sort WHERE/ORDER-BY helpers.
    const cursorClause = (c: Cursor | null) => {
      if (!c) return undefined;
      if (sort === "top" && "upvoteCount" in c) {
        // (upvoteCount, createdAt, id) DESC — next row must be strictly less.
        return or(
          lt(mountainCommentTable.upvoteCount, c.upvoteCount),
          and(
            eq(mountainCommentTable.upvoteCount, c.upvoteCount),
            lt(mountainCommentTable.createdAt, new Date(c.createdAt)),
          ),
          and(
            eq(mountainCommentTable.upvoteCount, c.upvoteCount),
            eq(mountainCommentTable.createdAt, new Date(c.createdAt)),
            lt(mountainCommentTable.id, c.id),
          ),
        );
      }
      if (sort === "oldest") {
        return or(
          gt(mountainCommentTable.createdAt, new Date(c.createdAt)),
          and(
            eq(mountainCommentTable.createdAt, new Date(c.createdAt)),
            gt(mountainCommentTable.id, c.id),
          ),
        );
      }
      // newest
      return or(
        lt(mountainCommentTable.createdAt, new Date(c.createdAt)),
        and(
          eq(mountainCommentTable.createdAt, new Date(c.createdAt)),
          lt(mountainCommentTable.id, c.id),
        ),
      );
    };

    const orderByFor = () => {
      if (sort === "top") {
        return [
          desc(mountainCommentTable.upvoteCount),
          desc(mountainCommentTable.createdAt),
          desc(mountainCommentTable.id),
        ];
      }
      if (sort === "oldest") {
        return [
          asc(mountainCommentTable.createdAt),
          asc(mountainCommentTable.id),
        ];
      }
      return [
        desc(mountainCommentTable.createdAt),
        desc(mountainCommentTable.id),
      ];
    };

    const summitFilter = onlySummiters
      ? exists(
          db
            .select({ one: sql`1` })
            .from(summitTable)
            .where(
              and(
                eq(summitTable.userId, mountainCommentTable.userId),
                eq(summitTable.mountainId, mountainCommentTable.mountainId),
              ),
            ),
        )
      : undefined;

    // Total count across the whole filtered dataset (not the page).
    // Search mode counts any matching row; non-search counts only top-level.
    const [totalRow] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(mountainCommentTable)
      .where(
        and(
          eq(mountainCommentTable.mountainId, query.mountainId),
          searchMode
            ? ilike(mountainCommentTable.body, `%${q}%`)
            : isNull(mountainCommentTable.parentCommentId),
          summitFilter,
        ),
      );
    const total = totalRow?.count ?? 0;

    // SEARCH MODE — flat: match any row (top-level or reply), ordered by sort.
    if (searchMode) {
      const rows = await db
        .select(selectCols)
        .from(mountainCommentTable)
        .innerJoin(userTable, eq(mountainCommentTable.userId, userTable.id))
        .where(
          and(
            eq(mountainCommentTable.mountainId, query.mountainId),
            ilike(mountainCommentTable.body, `%${q}%`),
            cursorClause(cursor),
            summitFilter,
          ),
        )
        .orderBy(...orderByFor())
        .limit(limit + 1);

      const hasMore = rows.length > limit;
      const page = hasMore ? rows.slice(0, limit) : rows;

      let upvotedSet = new Set<string>();
      if (viewerId && page.length > 0) {
        const upvotedRows = await db
          .select({ commentId: mountainCommentUpvoteTable.commentId })
          .from(mountainCommentUpvoteTable)
          .where(
            and(
              eq(mountainCommentUpvoteTable.userId, viewerId),
              inArray(
                mountainCommentUpvoteTable.commentId,
                page.map((r) => r.id),
              ),
            ),
          );
        upvotedSet = new Set(upvotedRows.map((u) => u.commentId));
      }

      // Fetch parent rows for any matched replies, so the UI can show
      // "Replying to ..." context even when the parent isn't in the page.
      const parentIds = Array.from(
        new Set(
          page
            .map((r) => r.parentCommentId)
            .filter((id): id is string => id !== null),
        ),
      );
      const parentsById = new Map<
        string,
        {
          id: string;
          body: string;
          user: {
            id: string;
            username: string | null;
            firstName: string | null;
            lastName: string | null;
            imageUrl: string | null;
            hasSummitedThisMountain: boolean;
          };
        }
      >();
      if (parentIds.length > 0) {
        const parentRows = await db
          .select({
            id: mountainCommentTable.id,
            body: mountainCommentTable.body,
            user: {
              id: userTable.id,
              username: userTable.username,
              firstName: userTable.firstName,
              lastName: userTable.lastName,
              imageUrl: userTable.imageUrl,
              hasSummitedThisMountain: summitedExpr,
            },
          })
          .from(mountainCommentTable)
          .innerJoin(userTable, eq(mountainCommentTable.userId, userTable.id))
          .where(inArray(mountainCommentTable.id, parentIds));
        for (const p of parentRows) parentsById.set(p.id, p);
      }

      const items = page.map((r) => {
        const parent =
          r.parentCommentId !== null
            ? parentsById.get(r.parentCommentId)
            : undefined;
        return {
          ...r,
          viewerHasUpvoted: upvotedSet.has(r.id),
          ...(parent ? { parent } : {}),
        };
      });

      const nextCursor = hasMore
        ? encodeCursor(
            sort === "top"
              ? {
                  upvoteCount: page[page.length - 1].upvoteCount,
                  createdAt: page[page.length - 1].createdAt.toISOString(),
                  id: page[page.length - 1].id,
                }
              : {
                  createdAt: page[page.length - 1].createdAt.toISOString(),
                  id: page[page.length - 1].id,
                },
          )
        : null;

      return {
        success: true,
        message: { items, nextCursor, total },
      };
    }

    // NON-SEARCH MODE — paginate top-level only, append replies inline.
    const topLevelRows = await db
      .select(selectCols)
      .from(mountainCommentTable)
      .innerJoin(userTable, eq(mountainCommentTable.userId, userTable.id))
      .where(
        and(
          eq(mountainCommentTable.mountainId, query.mountainId),
          isNull(mountainCommentTable.parentCommentId),
          cursorClause(cursor),
          summitFilter,
        ),
      )
      .orderBy(...orderByFor())
      .limit(limit + 1);

    const hasMore = topLevelRows.length > limit;
    const pageTopLevel = hasMore ? topLevelRows.slice(0, limit) : topLevelRows;

    if (pageTopLevel.length === 0) {
      return {
        success: true,
        message: { items: [], nextCursor: null, total },
      };
    }

    // Cap inline replies at INLINE_REPLY_CAP per top-level comment.
    // Client loads the rest on demand via /replies. Uses ROW_NUMBER() so we
    // only SELECT the first N per parent instead of pulling the whole tree.
    const INLINE_REPLY_CAP = 3;
    const parentIds = pageTopLevel.map((r) => r.id);

    // Count total replies per top-level in a single GROUP BY.
    const countRows = await db
      .select({
        parentCommentId: mountainCommentTable.parentCommentId,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(mountainCommentTable)
      .where(
        and(
          eq(mountainCommentTable.mountainId, query.mountainId),
          inArray(mountainCommentTable.parentCommentId, parentIds),
        ),
      )
      .groupBy(mountainCommentTable.parentCommentId);
    const replyCountByParent = new Map<string, number>();
    for (const r of countRows) {
      if (r.parentCommentId) replyCountByParent.set(r.parentCommentId, r.count);
    }

    // Fetch top N replies per top-level via a windowed subquery.
    const rankedReplies = db.$with("ranked_replies").as(
      db
        .select({
          id: mountainCommentTable.id,
          mountainId: mountainCommentTable.mountainId,
          parentCommentId: mountainCommentTable.parentCommentId,
          body: mountainCommentTable.body,
          upvoteCount: mountainCommentTable.upvoteCount,
          createdAt: mountainCommentTable.createdAt,
          updatedAt: mountainCommentTable.updatedAt,
          userId: mountainCommentTable.userId,
          rn: sql<number>`ROW_NUMBER() OVER (PARTITION BY ${mountainCommentTable.parentCommentId} ORDER BY ${mountainCommentTable.createdAt} ASC)`.as(
            "rn",
          ),
        })
        .from(mountainCommentTable)
        .where(
          and(
            eq(mountainCommentTable.mountainId, query.mountainId),
            inArray(mountainCommentTable.parentCommentId, parentIds),
          ),
        ),
    );

    const replyRows = await db
      .with(rankedReplies)
      .select({
        id: rankedReplies.id,
        mountainId: rankedReplies.mountainId,
        parentCommentId: rankedReplies.parentCommentId,
        body: rankedReplies.body,
        upvoteCount: rankedReplies.upvoteCount,
        createdAt: rankedReplies.createdAt,
        updatedAt: rankedReplies.updatedAt,
        user: {
          id: userTable.id,
          username: userTable.username,
          firstName: userTable.firstName,
          lastName: userTable.lastName,
          imageUrl: userTable.imageUrl,
          hasSummitedThisMountain: sql<boolean>`EXISTS (
            SELECT 1 FROM ${summitTable} s
            WHERE s.user_id = ${userTable.id}
              AND s.mountain_id = ${rankedReplies.mountainId}
          )`,
        },
      })
      .from(rankedReplies)
      .innerJoin(userTable, eq(rankedReplies.userId, userTable.id))
      .where(sql`${rankedReplies.rn} <= ${INLINE_REPLY_CAP}`)
      .orderBy(rankedReplies.createdAt);

    const allRows = [...pageTopLevel, ...replyRows];

    let upvotedSet = new Set<string>();
    if (viewerId && allRows.length > 0) {
      const upvotedRows = await db
        .select({ commentId: mountainCommentUpvoteTable.commentId })
        .from(mountainCommentUpvoteTable)
        .where(
          and(
            eq(mountainCommentUpvoteTable.userId, viewerId),
            inArray(
              mountainCommentUpvoteTable.commentId,
              allRows.map((r) => r.id),
            ),
          ),
        );
      upvotedSet = new Set(upvotedRows.map((u) => u.commentId));
    }

    const repliesByParent = new Map<string, typeof replyRows>();
    for (const r of replyRows) {
      if (!r.parentCommentId) continue;
      const list = repliesByParent.get(r.parentCommentId) ?? [];
      list.push(r);
      repliesByParent.set(r.parentCommentId, list);
    }
    const items = pageTopLevel.flatMap((p) => [
      {
        ...p,
        viewerHasUpvoted: upvotedSet.has(p.id),
        replyCount: replyCountByParent.get(p.id) ?? 0,
      },
      ...(repliesByParent.get(p.id) ?? []).map((reply) => ({
        ...reply,
        viewerHasUpvoted: upvotedSet.has(reply.id),
      })),
    ]);

    const last = pageTopLevel[pageTopLevel.length - 1];
    const nextCursor = hasMore
      ? encodeCursor(
          sort === "top"
            ? {
                upvoteCount: last.upvoteCount,
                createdAt: last.createdAt.toISOString(),
                id: last.id,
              }
            : {
                createdAt: last.createdAt.toISOString(),
                id: last.id,
              },
        )
      : null;

    return {
      success: true,
      message: { items, nextCursor, total },
    };
  },
  {
    query: t.Object({
      mountainId: t.String(),
      cursor: t.Optional(t.String()),
      limit: t.Optional(t.Number({ minimum: 1, maximum: 50 })),
      q: t.Optional(t.String()),
      sort: t.Optional(
        t.Union([t.Literal("newest"), t.Literal("oldest"), t.Literal("top")]),
      ),
      onlySummiters: t.Optional(t.Boolean()),
    }),
    response: SuccessResponse(MountainCommentsPageSchema),
  },
);
