import { eq } from "drizzle-orm";
import { Elysia } from "elysia";

import { db } from "@/db";
import { userTable } from "@/db/schema";
import { JWT } from "@/api/routes/@shared/jwt";
import { setRequestContext } from "@/api/routes/@shared/request-context";
import { protectedAdminRoutes } from "@/api/routes/protected/admin";
import { communityChallengeRoute } from "@/api/routes/protected/community-challenge";
import { donorsRoute } from "@/api/routes/protected/donors";
import { mountainLegacyPostRoute } from "@/api/routes/protected/mountain-legacy.post";
import { mountainsRoute } from "@/api/routes/protected/mountains";
import { planChatRoute } from "@/api/routes/protected/plan-chat";
import { plansRoute } from "@/api/routes/protected/plans";
import { shopRoutes } from "@/api/routes/protected/shop";
import { summitRoute } from "@/api/routes/protected/summit";
import { userRoute } from "@/api/routes/protected/user";

export const protectedRoutes = new Elysia({ prefix: "/protected" })
  .use(JWT())
  .onBeforeHandle(async ({ jwt, request, set }) => {
    const unauthorizedResponse = () => {
      set.status = 401;
      return { error: "Unauthorized" };
    };

    const auth = request.headers.get("authorization");
    const bearer = auth?.startsWith("Bearer ") ? auth.slice(7) : undefined;
    if (!bearer) {
      return unauthorizedResponse();
    }

    const verified = await jwt.verify(bearer);

    if (!verified || !verified.id || typeof verified.id !== "string") {
      return unauthorizedResponse();
    }

    // Explicit column list mirrors the `User` type in @shared/types.ts so
    // the shape is visible at the query site. Sensitive columns (push
    // tokens, server-only flags) are intentionally excluded so consumers
    // can't accidentally leak them via a `...user` spread in a response.
    const users = await db
      .select({
        id: userTable.id,
        email: userTable.email,
        firstName: userTable.firstName,
        lastName: userTable.lastName,
        imageUrl: userTable.imageUrl,
        town: userTable.town,
        phoneNumber: userTable.phoneNumber,
        visibleOnHiscores: userTable.visibleOnHiscores,
        visibleOnPeopleSearch: userTable.visibleOnPeopleSearch,
        admin: userTable.admin,
        country: userTable.country,
        platform: userTable.platform,
        appVersion: userTable.appVersion,
        lastLatitude: userTable.lastLatitude,
        lastLongitude: userTable.lastLongitude,
        lastLocationAt: userTable.lastLocationAt,
        username: userTable.username,
        locale: userTable.locale,
        activeChallengeId: userTable.activeChallengeId,
        unlockables: userTable.unlockables,
        createdAt: userTable.createdAt,
      })
      .from(userTable)
      .where(eq(userTable.id, verified.id));
    const user = users?.[0];

    if (!user || user.id !== verified.id) {
      return unauthorizedResponse();
    }

    setRequestContext(request, { user });
  })
  .use(userRoute)
  .use(mountainLegacyPostRoute) // LEGACY: /mountain/summit for old app versions
  .use(mountainsRoute)
  .use(summitRoute)
  .use(donorsRoute)
  .use(plansRoute)
  .use(planChatRoute)
  .use(communityChallengeRoute)
  .use(shopRoutes)
  .use(protectedAdminRoutes);
