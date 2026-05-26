import { and, desc, eq, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import {
  mountainTable,
  summitHasUsersTable,
  summitTable,
  userTable,
} from "@/db/schema";
import { SuccessResponse } from "@/api/schemas/common.schema";
import { PublicUserSummitsAllResponseSchema } from "@/api/schemas/user.schema";

// 24 keeps the two-column profile grid snappy on first paint (each card is
// 243px tall with an image). Cap matches the authenticated /all variant.
const DEFAULT_PAGE_SIZE = 24;
const MAX_PAGE_SIZE = 100;

export const userSummitsAllGetRoute = new Elysia().get(
  "/summits/all",
  async ({ query }) => {
    const userId = query.userId;
    const page = query.page ?? 1;
    const pageSize = Math.min(query.limit ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const offset = (page - 1) * pageSize;

    const whereCondition = and(eq(summitHasUsersTable.userId, userId));

    // Per-row shape mirrors the legacy /api/public/user/summits exactly so
    // the SummitCard renders the same (mountain image, participants
    // avatars, etc.). The participants subquery excludes the profile's
    // owner — same as the legacy endpoint.
    const pageQuery = db
      .select({
        summitId: summitTable.id,
        summitedAt: summitTable.summitedAt,
        summitedValidated: summitTable.validated,
        summitedImageUrl: summitTable.imageUrl,
        mountainName: mountainTable.name,
        mountainSlug: mountainTable.slug,
        mountainImageUrl: mountainTable.imageUrl,
        mountainHeight: mountainTable.height,
        mountainEssential: mountainTable.essential,
        participants: sql<
          {
            userId: string;
            firstName: string | null;
            lastName: string | null;
            imageUrl: string | null;
          }[]
        >`COALESCE(
          ARRAY(
            SELECT jsonb_build_object(
              'userId', ${userTable.id},
              'firstName', ${userTable.firstName},
              'lastName', ${userTable.lastName},
              'imageUrl', ${userTable.imageUrl}
            )
            FROM ${summitHasUsersTable}
            INNER JOIN ${userTable}
            ON ${summitHasUsersTable.userId} = ${userTable.id}
            WHERE ${summitHasUsersTable.summitId} = ${summitTable.id}
            AND ${summitHasUsersTable.userId} != ${userId}
          ), '{}'
        )`.as("participants"),
      })
      .from(summitHasUsersTable)
      .innerJoin(summitTable, eq(summitHasUsersTable.summitId, summitTable.id))
      .innerJoin(mountainTable, eq(summitTable.mountainId, mountainTable.id))
      .where(whereCondition)
      .groupBy(
        summitTable.id,
        summitTable.summitedAt,
        summitTable.validated,
        summitTable.imageUrl,
        mountainTable.name,
        mountainTable.slug,
        mountainTable.imageUrl,
        mountainTable.height,
        mountainTable.essential,
      )
      // `summitTable.id` tiebreaks the two date columns — without it, two
      // summits sharing both timestamps (bulk imports, same-second logging)
      // can swap across pages, and a new summit recorded mid-scroll shifts
      // every OFFSET by 1, surfacing a duplicate at the page boundary.
      .orderBy(
        desc(summitTable.summitedAt),
        desc(summitTable.createdAt),
        desc(summitTable.id),
      )
      .limit(pageSize)
      .offset(offset);

    const countQuery = db
      .select({ totalItems: sql<number>`COUNT(*)` })
      .from(summitHasUsersTable)
      .where(whereCondition);

    const [items, countResult] = await Promise.all([pageQuery, countQuery]);

    const totalItems = Number(countResult[0]?.totalItems ?? 0);
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    return {
      success: true,
      message: {
        items,
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
      userId: t.String(),
      page: t.Optional(t.Numeric({ minimum: 1 })),
      limit: t.Optional(t.Numeric({ minimum: 1, maximum: MAX_PAGE_SIZE })),
    }),
    response: SuccessResponse(PublicUserSummitsAllResponseSchema),
  },
);
