import { bearer } from "@elysiajs/bearer";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";

import { db } from "@/db";
import { userTable } from "@/db/schema";
import { JWT } from "@/api/routes/@shared/jwt";
import { setRequestContext } from "@/api/routes/@shared/request-context";
import { communityChallengeRoute } from "@/api/routes/protected/community-challenge";
import { donorsRoute } from "@/api/routes/protected/donors";
import { mountainLegacyPostRoute } from "@/api/routes/protected/mountain-legacy.post";
import { mountainsRoute } from "@/api/routes/protected/mountains";
import { planChatRoute } from "@/api/routes/protected/plan-chat";
import { plansRoute } from "@/api/routes/protected/plans";
import { summitRoute } from "@/api/routes/protected/summit";
import { userRoute } from "@/api/routes/protected/user";

export const protectedRoutes = new Elysia({ prefix: "/protected" })
  .use(JWT())
  .use(bearer())
  .resolve(async ({ jwt, bearer, request, set }) => {
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

    if (!user || user.id !== verified.id) {
      return unauthorizedResponse();
    }

    setRequestContext(request, { user });
    return { user };
  })
  .use(userRoute)
  .use(mountainLegacyPostRoute) // LEGACY: /mountain/summit for old app versions
  .use(mountainsRoute)
  .use(summitRoute)
  .use(donorsRoute)
  .use(plansRoute)
  .use(planChatRoute)
  .use(communityChallengeRoute);
