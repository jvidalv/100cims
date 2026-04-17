import { Elysia } from "elysia";

import { getUserFromRequest } from "@/api/routes/@shared/auth";
import { adminChallengeDeleteRoute } from "@/api/routes/protected/admin/admin.challenge-delete.delete";
import { adminPlanDeleteRoute } from "@/api/routes/protected/admin/admin.plan-delete.delete";
import { adminSummitDeleteRoute } from "@/api/routes/protected/admin/admin.summit-delete.delete";

export const protectedAdminRoutes = new Elysia({ prefix: "/admin" })
  .resolve(({ request, set }) => {
    const user = getUserFromRequest(request);
    if (!user.admin) {
      set.status = 403;
      return { error: "Forbidden" };
    }
    return { adminUser: user };
  })
  .use(adminSummitDeleteRoute)
  .use(adminPlanDeleteRoute)
  .use(adminChallengeDeleteRoute);
