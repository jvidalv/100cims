import { count, eq, or, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { challengeHasMountainTable, mountainTable } from "@/db/schema";
import { SuccessResponse } from "@/api/schemas/common.schema";

const DEFAULT_PAGE_SIZE = 20;

const MountainSearchResultSchema = t.Object({
  id: t.String(),
  name: t.String(),
  slug: t.String(),
  location: t.String(),
  height: t.String(),
  latitude: t.String(),
  longitude: t.String(),
  imageUrl: t.Union([t.String(), t.Null()]),
  essential: t.Boolean(),
});

const PaginatedMountainsSchema = t.Object({
  items: t.Array(MountainSearchResultSchema),
  pagination: t.Object({
    page: t.Number(),
    pageSize: t.Number(),
    totalItems: t.Number(),
    totalPages: t.Number(),
    hasMore: t.Boolean(),
  }),
});

export const challengeSearchMountainsGetRoute = new Elysia().get(
  "/search-mountains",
  async ({ query }) => {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;
    const offset = (page - 1) * pageSize;
    const searchQuery = query.query?.trim();
    const challengeId = query.challengeId;

    // Build the where clause
    // If there's a search query, search across ALL mountains (ignoring challengeId)
    // If no search query, filter by challengeId
    const hasSearchQuery = searchQuery && searchQuery.length > 0;

    let whereCondition;
    if (hasSearchQuery) {
      // Search across all mountains by name or location (accent-insensitive)
      whereCondition = or(
        sql`unaccent(${mountainTable.name}) ILIKE unaccent(${`%${searchQuery}%`})`,
        sql`unaccent(${mountainTable.location}) ILIKE unaccent(${`%${searchQuery}%`})`,
      );
    } else if (challengeId) {
      // No search query - filter by challenge
      // This requires a join with challengeHasMountainTable
      whereCondition = undefined; // We'll handle this with the join
    } else {
      // No search query and no challengeId - return empty (require at least one filter)
      return {
        success: true,
        message: {
          items: [],
          pagination: {
            page,
            pageSize,
            totalItems: 0,
            totalPages: 0,
            hasMore: false,
          },
        },
      };
    }

    // Count total items
    let totalItems: number;
    let mountains;

    if (hasSearchQuery) {
      // Search mode - query all mountains
      const [countResult, mountainsResult] = await Promise.all([
        db.select({ count: count() }).from(mountainTable).where(whereCondition),
        db
          .select({
            id: mountainTable.id,
            name: mountainTable.name,
            slug: mountainTable.slug,
            location: mountainTable.location,
            height: mountainTable.height,
            latitude: mountainTable.latitude,
            longitude: mountainTable.longitude,
            imageUrl: mountainTable.imageUrl,
            essential: mountainTable.essential,
          })
          .from(mountainTable)
          .where(whereCondition)
          .orderBy(mountainTable.name)
          .limit(pageSize)
          .offset(offset),
      ]);
      totalItems = countResult[0]?.count ?? 0;
      mountains = mountainsResult;
    } else {
      // Challenge filter mode
      const [countResult, mountainsResult] = await Promise.all([
        db
          .select({ count: count() })
          .from(mountainTable)
          .innerJoin(
            challengeHasMountainTable,
            eq(challengeHasMountainTable.mountainId, mountainTable.id),
          )
          .where(eq(challengeHasMountainTable.challengeId, challengeId!)),
        db
          .select({
            id: mountainTable.id,
            name: mountainTable.name,
            slug: mountainTable.slug,
            location: mountainTable.location,
            height: mountainTable.height,
            latitude: mountainTable.latitude,
            longitude: mountainTable.longitude,
            imageUrl: mountainTable.imageUrl,
            essential: mountainTable.essential,
          })
          .from(mountainTable)
          .innerJoin(
            challengeHasMountainTable,
            eq(challengeHasMountainTable.mountainId, mountainTable.id),
          )
          .where(eq(challengeHasMountainTable.challengeId, challengeId!))
          .orderBy(mountainTable.name)
          .limit(pageSize)
          .offset(offset),
      ]);
      totalItems = countResult[0]?.count ?? 0;
      mountains = mountainsResult;
    }

    const totalPages = Math.ceil(totalItems / pageSize);

    return {
      success: true,
      message: {
        items: mountains,
        pagination: {
          page,
          pageSize,
          totalItems,
          totalPages,
          hasMore: page < totalPages,
        },
      },
    };
  },
  {
    query: t.Object({
      query: t.Optional(t.String()),
      challengeId: t.Optional(t.String()),
      page: t.Optional(t.Number()),
      pageSize: t.Optional(t.Number()),
    }),
    response: SuccessResponse(PaginatedMountainsSchema),
  },
);
