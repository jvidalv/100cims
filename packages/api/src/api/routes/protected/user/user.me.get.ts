import { eq } from "drizzle-orm";
import { Elysia } from "elysia";

import { db } from "@/db";
import { userTable } from "@/db/schema";
import { resolveCountryFromRequest } from "@/api/lib/geoip";
import {
  resolveAppVersionFromRequest,
  resolvePlatformFromRequest,
} from "@/api/lib/request-headers";
import { getUserFromRequest } from "@/api/routes/@shared/auth";
import { SuccessResponse } from "@/api/schemas/common.schema";
import { UserSchema } from "@/api/schemas/user.schema";

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

    if (Object.keys(updates).length) {
      await db
        .update(userTable)
        .set(updates)
        .where(eq(userTable.id, user.id));
    }

    return { success: true, message: { ...user, ...updates } };
  },
  {
    response: SuccessResponse(UserSchema),
  },
);
