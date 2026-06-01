import { and, eq, isNull, lt, or, sql } from "drizzle-orm";
import { Elysia } from "elysia";

import { db } from "@/db";
import { userTable } from "@/db/schema";
import { resolveCountryFromRequest } from "@/api/lib/geoip";
import {
  resolveAppVersionFromRequest,
  resolveCoordinatesFromRequest,
  resolvePlatformFromRequest,
} from "@/api/lib/request-headers";
import { getUserFromRequest } from "@/api/routes/@shared/auth";
import { SuccessResponse } from "@/api/schemas/common.schema";
import { MeSchema } from "@/api/schemas/user.schema";

export const userMeGetRoute = new Elysia().get(
  "/me",
  async ({ request }) => {
    const user = getUserFromRequest(request);

    const updates: Partial<typeof userTable.$inferInsert> = {};
    if (!user.country) {
      const country = resolveCountryFromRequest(request);
      if (country) updates.country = country;
    }
    if (!user.platform) {
      const platform = resolvePlatformFromRequest(request);
      if (platform) updates.platform = platform;
    }
    const appVersion = resolveAppVersionFromRequest(request);
    if (appVersion) updates.appVersion = appVersion;

    const coords = resolveCoordinatesFromRequest(request);
    if (coords) {
      updates.lastLatitude = coords.latitude;
      updates.lastLongitude = coords.longitude;
      updates.lastLocationAt = new Date();
    }

    if (Object.keys(updates).length) {
      await db.update(userTable).set(updates).where(eq(userTable.id, user.id));
    }

    // Drives DAU/MAU. Bumped at most once per user every 5 minutes so a
    // user who tab-switches a lot doesn't generate a write per /me. The
    // WHERE makes the throttle atomic — concurrent /me requests can't
    // race past each other and double-bump. Fire-and-forget: don't make
    // the response wait on this background write.
    void db
      .update(userTable)
      .set({ lastSeenAt: new Date() })
      .where(
        and(
          eq(userTable.id, user.id),
          or(
            isNull(userTable.lastSeenAt),
            lt(userTable.lastSeenAt, sql`NOW() - INTERVAL '5 minutes'`),
          ),
        ),
      )
      .catch((err) => {
        console.warn("[me] lastSeenAt bump failed", err);
      });

    return { success: true, message: { ...user, ...updates } };
  },
  {
    response: SuccessResponse(MeSchema),
  },
);
