import { bearer } from "@elysiajs/bearer";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";

import { db } from "@/db";
import { userTable } from "@/db/schema";
import { JWT } from "@/api/routes/@shared/jwt";
import { User } from "@/api/routes/@shared/types";
import { communityChallengeRoute } from "@/api/routes/protected/community-challenge";
import { donorRoute } from "@/api/routes/protected/donor.route";
import { mountainLegacyRoute } from "@/api/routes/protected/mountain-legacy.route";
import { mountainsRoute } from "@/api/routes/protected/mountains";
import { planChatRoute } from "@/api/routes/protected/plan-chat.route";
import { planPrivateRoute } from "@/api/routes/protected/plan.route";
import { summitRoute } from "@/api/routes/protected/summit.route";
import { userRoute } from "@/api/routes/protected/user";

export const protectedRoutes = new Elysia({ prefix: "/protected" })
  .use(JWT())
  .use(bearer())
  .onBeforeHandle(async ({ jwt, bearer, store, set }) => {
    const unauthorizedResponse = () => {
      set.status = 401;
      return { error: "Unauthorized" };
    };

    if (!bearer) {
      return unauthorizedResponse();
    }

    const verified = await jwt.verify(bearer);

    if (!verified || !verified.id || typeof verified.id !== "string") {
      return unauthorizedResponse();
    }

    const users = await db
      .select()
      .from(userTable)
      .where(eq(userTable.id, verified.id));
    const user = users?.[0];

    (store as { user: User }).user = user;

    if (!user || user.id !== verified.id) {
      return unauthorizedResponse();
    }
  })
  .use(userRoute)
  .use(mountainLegacyRoute) // LEGACY: /mountain/summit for old app versions
  .use(mountainsRoute)
  .use(summitRoute)
  .use(donorRoute)
  .use(planPrivateRoute)
  .use(planChatRoute)
  .use(communityChallengeRoute);
