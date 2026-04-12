import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { getToken } from "next-auth/jwt";

import { db } from "@/db";
import { userTable } from "@/db/schema";
import { setAdminContext } from "@/api/routes/admin/admin-context";
import { adminCronsGetRoute } from "@/api/routes/admin/admin.crons.get";
import { adminCronsTriggerPostRoute } from "@/api/routes/admin/admin.crons-trigger.post";
import { adminMeGetRoute } from "@/api/routes/admin/admin.me.get";

export const adminRoutes = new Elysia({ prefix: "/admin" })
  .resolve(async ({ request, set }) => {
    const unauthorized = () => {
      set.status = 401;
      return { error: "Unauthorized" };
    };
    const forbidden = () => {
      set.status = 403;
      return { error: "Forbidden" };
    };

    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
    });
    if (!token || typeof token.userId !== "string") return unauthorized();

    const [row] = await db
      .select({ admin: userTable.admin })
      .from(userTable)
      .where(eq(userTable.id, token.userId));

    if (!row) return unauthorized();
    if (!row.admin) return forbidden();

    setAdminContext(request, { userId: token.userId });
    return { userId: token.userId };
  })
  .use(adminMeGetRoute)
  .use(adminCronsGetRoute)
  .use(adminCronsTriggerPostRoute);
