import { and, eq, gte, inArray, lte, sql, type SQL } from "drizzle-orm";
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
import {
  RouteListItemSchema,
  TrailTypeSchema,
} from "@/api/schemas/route.schema";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export const routeListGetRoute = new Elysia().get(
  "/list",
  async ({ query }) => {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, query.pageSize ?? DEFAULT_PAGE_SIZE),
    );
    const offset = (page - 1) * pageSize;

    // When filtering by mountain we restrict the route IDs to those joined
    // through mountain_route. Done as a subselect rather than a JOIN so the
    // outer count/select stay simple and we don't have to dedupe routes
    // that summit multiple peaks.
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
    if (query.q?.trim()) {
      // Escape LIKE metacharacters so a literal `%` in the user's search
      // doesn't match every row.
      const escaped = query.q.trim().replace(/[\\%_]/g, (c) => `\\${c}`);
      const pattern = `%${escaped}%`;
      // Title is JSONB { en, ca, es }; search across all three locales via
      // ->>. Drizzle doesn't have a typed helper for jsonb ->> so we use
      // raw sql snippets here.
      conditions.push(
        sql`(${routeTable.title} ->> 'en' ILIKE ${pattern}
           OR ${routeTable.title} ->> 'ca' ILIKE ${pattern}
           OR ${routeTable.title} ->> 'es' ILIKE ${pattern}
           OR ${routeTable.titleRaw} ILIKE ${pattern})`,
      );
    }
    if (query.trailType) {
      conditions.push(eq(routeTable.trailType, query.trailType));
    }
    if (query.minDistance != null) {
      conditions.push(gte(routeTable.distanceMeters, query.minDistance));
    }
    if (query.maxDistance != null) {
      conditions.push(lte(routeTable.distanceMeters, query.maxDistance));
    }
    // Multi-peak filter: only routes whose join-table row count > 1.
    if (query.multiPeak) {
      conditions.push(
        sql`(SELECT COUNT(*) FROM ${mountainRouteTable}
             WHERE ${mountainRouteTable.routeId} = ${routeTable.id}) > 1`,
      );
    }
    const where = conditions.length ? and(...conditions) : undefined;

    // Run items and count in parallel — independent queries against the
    // same WHERE; sequential awaits would double request latency.
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
        // Stable order: distance is the user-visible sort but is nullable
        // with many ties — id breaks the tie so pagination doesn't shift.
        .orderBy(routeTable.distanceMeters, routeTable.id)
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
      mountainSlug: t.Optional(t.String()),
      q: t.Optional(t.String()),
      trailType: t.Optional(TrailTypeSchema),
      minDistance: t.Optional(t.Number()),
      maxDistance: t.Optional(t.Number()),
      multiPeak: t.Optional(t.Boolean()),
      page: t.Optional(t.Number()),
      pageSize: t.Optional(t.Number()),
    }),
    response: SuccessResponse(PaginatedSchema(RouteListItemSchema)),
  },
);
