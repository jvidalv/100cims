import { bearer } from "@elysiajs/bearer";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";

import { db } from "@/api/db";
import { userTable } from "@/api/db/schema";
import { JWT } from "@/api/routes/@shared/jwt";
import { User } from "@/api/routes/@shared/types";
import { donorRoute } from "@/api/routes/protected/donor.route";
import { mountainRoute } from "@/api/routes/protected/mountain.route";
import { planChatRoute } from "@/api/routes/protected/plan-chat.route";
import { planPrivateRoute } from "@/api/routes/protected/plan.route";
import { stripeRoute } from "@/api/routes/protected/stripe.route";
import { summitRoute } from "@/api/routes/protected/summit.route";
import { userRoute } from "@/api/routes/protected/user.route";

export const protectedRoutes = new Elysia({ prefix: "/protected" })
  .use(JWT())
  .use(bearer())
  .onBeforeHandle(async ({ jwt, bearer, store, error }) => {
    const unauthorizedResponse = () => {
      return error(401, { success: false, message: "Unauthorized" });
    };

    if (!bearer) {
      return unauthorizedResponse();
    }

    const verified = await jwt.verify(bearer as string);

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
  .use(stripeRoute)
  .use(donorRoute)
  .use(planPrivateRoute)
  .use(planChatRoute);
