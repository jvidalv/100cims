import { and, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { mountainRouteTable, routeTable } from "@/db/schema";
import { downsampleCoordsForList } from "@/api/routes/@shared/downsample-coords";
import {
  sanitizeSource,
  sanitizeTechnicalDifficulty,
  sanitizeTrailType,
} from "@/api/routes/@shared/route-enums";
import { routeMountainsSql } from "@/api/routes/@shared/route-mountains-sql";
import { PaginatedSchema, SuccessResponse } from "@/api/schemas/common.schema";
import { RouteListItemSchema } from "@/api/schemas/route.schema";

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

export const adminRouteListGetRoute = new Elysia().get(
  "/routes",
  async ({ query }) => {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, query.pageSize ?? DEFAULT_PAGE_SIZE),
    );
    const offset = (page - 1) * pageSize;

    const conditions: SQL[] = [];
    if (query.mountainSlug) {
      conditions.push(
        inArray(
          routeTable.id,
          db
            .select({ id: mountainRouteTable.routeId })
            .from(mountainRouteTable)
            .where(eq(mountainRouteTable.mountainSlug, query.mountainSlug)),
        ),
      );
    }
    const search = query.q?.trim();
    if (search) {
      const escaped = search.replace(/[\\%_]/g, (c) => `\\${c}`);
      const pattern = `%${escaped}%`;
      const searchCondition = or(
        sql`${routeTable.title} ->> 'en' ILIKE ${pattern}`,
        sql`${routeTable.title} ->> 'ca' ILIKE ${pattern}`,
        sql`${routeTable.title} ->> 'es' ILIKE ${pattern}`,
        ilike(routeTable.titleRaw, pattern),
        ilike(routeTable.externalId, pattern),
      );
      if (searchCondition) conditions.push(searchCondition);
    }
    if (query.multiPeak) {
      conditions.push(
        sql`(SELECT COUNT(*) FROM ${mountainRouteTable}
             WHERE ${mountainRouteTable.routeId} = ${routeTable.id}) > 1`,
      );
    }
    const where = conditions.length ? and(...conditions) : undefined;

    const [items, totalRow] = await Promise.all([
      db
        .select({
          id: routeTable.id,
          externalId: routeTable.externalId,
          source: routeTable.source,
          url: routeTable.url,
          title: routeTable.title,
          titleRaw: routeTable.titleRaw,
          description: routeTable.description,
          author: routeTable.author,
          distanceMeters: routeTable.distanceMeters,
          elevationGainMeters: routeTable.elevationGainMeters,
          elevationLossMeters: routeTable.elevationLossMeters,
          maxElevationMeters: routeTable.maxElevationMeters,
          minElevationMeters: routeTable.minElevationMeters,
          technicalDifficulty: routeTable.technicalDifficulty,
          trailType: routeTable.trailType,
          movingTimeSeconds: routeTable.movingTimeSeconds,
          totalTimeSeconds: routeTable.totalTimeSeconds,
          coordinatesCount: routeTable.coordinatesCount,
          uploadedAt: routeTable.uploadedAt,
          recordedAt: routeTable.recordedAt,
          coordinates: routeTable.coordinates,
          mountains: routeMountainsSql,
        })
        .from(routeTable)
        .where(where)
        .orderBy(routeTable.createdAt, routeTable.id)
        .limit(pageSize)
        .offset(offset),
      db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(routeTable)
        .where(where),
    ]);
    const totalItems = totalRow[0]?.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    return {
      success: true,
      message: {
        items: items.map((r) => ({
          ...r,
          source: sanitizeSource(r.source),
          technicalDifficulty: sanitizeTechnicalDifficulty(
            r.technicalDifficulty,
          ),
          trailType: sanitizeTrailType(r.trailType),
          coordinates: downsampleCoordsForList(r.coordinates),
        })),
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
      q: t.Optional(t.String()),
      mountainSlug: t.Optional(t.String()),
      multiPeak: t.Optional(t.Boolean()),
      page: t.Optional(t.Number()),
      pageSize: t.Optional(t.Number()),
    }),
    response: SuccessResponse(PaginatedSchema(RouteListItemSchema)),
  },
);
