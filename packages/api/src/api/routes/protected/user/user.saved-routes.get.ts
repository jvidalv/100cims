import { and, desc, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import {
  mountainRouteTable,
  mountainTable,
  routeTable,
  userSavedRouteTable,
} from "@/db/schema";
import { getUserFromRequest } from "@/api/routes/@shared/auth";
import { SuccessResponse } from "@/api/schemas/common.schema";
import { LocalizedStringSchema } from "@/api/schemas/route.schema";

const SavedRouteSchema = t.Object({
  routeId: t.String(),
  externalId: t.String(),
  source: t.String(),
  url: t.String(),
  title: LocalizedStringSchema,
  distanceMeters: t.Nullable(t.Number()),
  elevationGainMeters: t.Nullable(t.Number()),
  // Primary mountain (lowest `ordinal` in `mountain_route`) — drives the
  // thumbnail and the deep-link href so tapping a saved route lands on
  // `/mountain/[slug]/routes/[routeId]` without an extra fetch.
  mountainSlug: t.Nullable(t.String()),
  mountainName: t.Nullable(t.String()),
  mountainImageUrl: t.Nullable(t.String()),
  savedAt: t.Date(),
});

export const userSavedRoutesGetRoute = new Elysia().get(
  "/saved-routes",
  async ({ request }) => {
    const user = getUserFromRequest(request);

    // `mountain_route_slug_route_unq` guarantees at most one (slug, route)
    // pair, and the geometric detector writes the primary as ordinal=0 — so
    // joining on `ordinal = 0` returns the canonical row when present, and
    // NULL otherwise (route attributed but not at ordinal 0, or unattributed).
    const rows = await db
      .select({
        routeId: routeTable.id,
        externalId: routeTable.externalId,
        source: routeTable.source,
        url: routeTable.url,
        title: routeTable.title,
        distanceMeters: routeTable.distanceMeters,
        elevationGainMeters: routeTable.elevationGainMeters,
        mountainSlug: mountainTable.slug,
        mountainName: mountainTable.name,
        mountainImageUrl: mountainTable.imageUrl,
        savedAt: userSavedRouteTable.createdAt,
      })
      .from(userSavedRouteTable)
      .innerJoin(routeTable, eq(routeTable.id, userSavedRouteTable.routeId))
      .leftJoin(
        mountainRouteTable,
        and(
          eq(mountainRouteTable.routeId, routeTable.id),
          eq(mountainRouteTable.ordinal, 0),
        ),
      )
      .leftJoin(
        mountainTable,
        eq(mountainTable.slug, mountainRouteTable.mountainSlug),
      )
      .where(eq(userSavedRouteTable.userId, user.id))
      .orderBy(desc(userSavedRouteTable.createdAt));

    return { success: true, message: rows };
  },
  {
    response: SuccessResponse(t.Array(SavedRouteSchema)),
  },
);
