import { bearer } from "@elysiajs/bearer";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";

import { db } from "@/db";
import { userTable } from "@/db/schema";
import { JWT } from "@/api/routes/@shared/jwt";
import { User } from "@/api/routes/@shared/types";
import { donorRoute } from "@/api/routes/protected/donor.route";
import { mountainRoute } from "@/api/routes/protected/mountain.route";
import { planChatRoute } from "@/api/routes/protected/plan-chat.route";
import { planPrivateRoute } from "@/api/routes/protected/plan.route";
import { summitRoute } from "@/api/routes/protected/summit.route";
import { userRoute } from "@/api/routes/protected/user.route";

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

    if (!verified || !verified.id) {
      return unauthorizedResponse();
    }

    const users = await db
      .select()
      .from(userTable)
      .where(eq(userTable.id, verified.id as string));
    const user = users?.[0];

    (store as { user: User }).user = user;

    if (!user || user.id !== verified.id) {
      return unauthorizedResponse();
    }
  })
  .use(userRoute)
  .use(mountainRoute)
  .use(summitRoute)
  .use(donorRoute)
  .use(planPrivateRoute)
  .use(planChatRoute);
