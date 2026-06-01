import { eq, or } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { routeTable } from "@/db/schema";
import {
  sanitizeSource,
  sanitizeTechnicalDifficulty,
  sanitizeTrailType,
} from "@/api/routes/@shared/route-enums";
import { routeMountainsSql } from "@/api/routes/@shared/route-mountains-sql";
import { SuccessResponse } from "@/api/schemas/common.schema";
import { RouteDetailSchema } from "@/api/schemas/route.schema";

// Strict uuid v4-ish match — guards against passing arbitrary strings to a
// uuid column and getting Postgres 22P02 (500) instead of a clean 404.
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const routeOneGetRoute = new Elysia().get(
  "/one",
  async ({ query, set }) => {
    const rows = await db
      .select({
        id: routeTable.id,
        externalId: routeTable.externalId,
        source: routeTable.source,
        url: routeTable.url,
        title: routeTable.title,
        titleRaw: routeTable.titleRaw,
        description: routeTable.description,
        descriptionRaw: routeTable.descriptionRaw,
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
      // Accept either the DB uuid or the source external_id (so old
      // share-deeplinks built with externalId still resolve). The UUID
      // regex guards the uuid column from a 22P02 cast crash.
      .where(
        UUID_RE.test(query.id)
          ? or(eq(routeTable.id, query.id), eq(routeTable.externalId, query.id))
          : eq(routeTable.externalId, query.id),
      )
      .limit(1);

    const route = rows[0];
    if (!route) {
      set.status = 404;
      throw new Error("Route not found");
    }
    return {
      success: true,
      message: {
        ...route,
        source: sanitizeSource(route.source),
        technicalDifficulty: sanitizeTechnicalDifficulty(
          route.technicalDifficulty,
        ),
        trailType: sanitizeTrailType(route.trailType),
      },
    };
  },
  {
    query: t.Object({
      id: t.String(),
    }),
    response: SuccessResponse(RouteDetailSchema),
  },
);
