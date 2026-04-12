import { bearer } from "@elysiajs/bearer";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";

import { db } from "@/db";
import { userTable } from "@/db/schema";
import { JWT } from "@/api/routes/@shared/jwt";
import { setRequestContext } from "@/api/routes/@shared/request-context";
import { adminCronsGetRoute } from "@/api/routes/admin/admin.crons.get";
import { adminCronsTriggerPostRoute } from "@/api/routes/admin/admin.crons-trigger.post";

export const adminRoutes = new Elysia({ prefix: "/admin" })
  .use(JWT())
  .use(bearer())
  .resolve(async ({ jwt, bearer, request, set }) => {
    const unauthorized = () => {
      set.status = 401;
      return { error: "Unauthorized" };
    };
    const forbidden = () => {
      set.status = 403;
      return { error: "Forbidden" };
    };

    if (!bearer) return unauthorized();

    const verified = await jwt.verify(bearer);
    if (!verified || typeof verified.id !== "string") return unauthorized();

    const [user] = await db
      .select()
      .from(userTable)
      .where(eq(userTable.id, verified.id));

    if (!user || user.id !== verified.id) return unauthorized();
    if (!user.admin) return forbidden();

    setRequestContext(request, { user });
    return { user };
  })
  .use(adminCronsGetRoute)
  .use(adminCronsTriggerPostRoute);
