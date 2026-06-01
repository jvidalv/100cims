import { and, desc, eq, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import {
  challengeHasMountainTable,
  mountainTable,
  summitHasUsersTable,
  summitTable,
  userTable,
} from "@/db/schema";
import { resolveChallengeId } from "@/api/routes/@shared/challenge";
import { JWT } from "@/api/routes/@shared/jwt";
import {
  getBearerToken,
  getOptionalUser,
} from "@/api/routes/@shared/optional-auth";
import { SuccessResponse } from "@/api/schemas/common.schema";
import { MountainSummitsAllResponseSchema } from "@/api/schemas/mountain.schema";

// 24 keeps the two-column SummitCard grid snappy on first paint (each
// card is 243px tall with an image). Cap mirrors the user-profile /all
// variant.
const DEFAULT_PAGE_SIZE = 24;
const MAX_PAGE_SIZE = 100;

/**
 * Paginated variant of `/api/public/mountains/summits` — returns every
 * validated summit for the given mountain in 24-item pages. The legacy
 * `/summits` endpoint stays around with its flat-array contract so older
 * mobile clients keep working.
 *
 * Participants are aggregated via a correlated subquery so each summit row
 * carries its full `users[]` list without an extra round-trip per page.
 */
export const mountainSummitsAllGetRoute = new Elysia().use(JWT()).get(
  "/summits/all",
  async ({ query, jwt, headers }) => {
    const mountainId = query.mountainId;
    const page = query.page ?? 1;
    const pageSize = Math.min(query.limit ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const offset = (page - 1) * pageSize;

    const optionalUser = await getOptionalUser(jwt, getBearerToken(headers));
    // Priority: query.challengeId > user.activeChallengeId > DEFAULT_CHALLENGE_ID
    const challengeId = resolveChallengeId(query.challengeId, optionalUser);

    const whereCondition = and(
      eq(summitTable.validated, true),
      eq(summitTable.mountainId, mountainId),
      eq(challengeHasMountainTable.challengeId, challengeId),
    );

    const pageQuery = db
      .select({
        summitId: summitTable.id,
        summitedAt: summitTable.summitedAt,
        summitImageUrl: summitTable.imageUrl,
        createdAt: summitTable.createdAt,
        mountainId: summitTable.mountainId,
        mountainName: mountainTable.name,
        mountainSlug: mountainTable.slug,
        users: sql<
          {
            id: string;
            firstName: string | null;
            lastName: string | null;
            imageUrl: string | null;
          }[]
        >`COALESCE(
          ARRAY(
            SELECT jsonb_build_object(
              'id', ${userTable.id},
              'firstName', ${userTable.firstName},
              'lastName', ${userTable.lastName},
              'imageUrl', ${userTable.imageUrl}
            )
            FROM ${summitHasUsersTable}
            INNER JOIN ${userTable}
            ON ${summitHasUsersTable.userId} = ${userTable.id}
            WHERE ${summitHasUsersTable.summitId} = ${summitTable.id}
          ), '{}'
        )`.as("users"),
      })
      .from(summitTable)
      .innerJoin(mountainTable, eq(summitTable.mountainId, mountainTable.id))
      .leftJoin(
        challengeHasMountainTable,
        eq(mountainTable.id, challengeHasMountainTable.mountainId),
      )
      .where(whereCondition)
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
      .from(summitTable)
      .leftJoin(
        challengeHasMountainTable,
        eq(summitTable.mountainId, challengeHasMountainTable.mountainId),
      )
      .where(whereCondition);

    const [rows, countResult] = await Promise.all([pageQuery, countQuery]);

    // We filter `eq(summitTable.mountainId, mountainId)` so every row's
    // `mountainId` is the same non-null value — but Drizzle still types
    // the column as `string | null` (the DB column allows null because
    // mountain deletion sets it to null). Pin it back to the input.
    const items = rows.map((row) => ({ ...row, mountainId }));

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
      mountainId: t.String(),
      page: t.Optional(t.Numeric({ minimum: 1 })),
      limit: t.Optional(t.Numeric({ minimum: 1, maximum: MAX_PAGE_SIZE })),
      challengeId: t.Optional(t.String()),
    }),
    response: SuccessResponse(MountainSummitsAllResponseSchema),
  },
);
