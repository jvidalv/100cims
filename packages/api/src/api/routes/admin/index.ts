import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { getToken } from "next-auth/jwt";

import { db } from "@/db";
import { userTable } from "@/db/schema";
import { setAdminContext } from "@/api/routes/admin/admin-context";
import { adminChallengeDeleteDeleteRoute } from "@/api/routes/admin/admin.challenge-delete.delete";
import { adminChallengeDetailGetRoute } from "@/api/routes/admin/admin.challenge-detail.get";
import { adminChallengeMountainsGetRoute } from "@/api/routes/admin/admin.challenge-mountains.get";
import { adminChallengeUpdatePostRoute } from "@/api/routes/admin/admin.challenge-update.post";
import { adminChallengesGetRoute } from "@/api/routes/admin/admin.challenges.get";
import { adminCronsGetRoute } from "@/api/routes/admin/admin.crons.get";
import { adminCronsTriggerPostRoute } from "@/api/routes/admin/admin.crons-trigger.post";
import { adminEmailTestPostRoute } from "@/api/routes/admin/admin.email-test.post";
import { adminMeGetRoute } from "@/api/routes/admin/admin.me.get";
import { adminMerchCreatePostRoute } from "@/api/routes/admin/admin.merch-create.post";
import { adminMerchDeleteDeleteRoute } from "@/api/routes/admin/admin.merch-delete.delete";
import { adminMerchDetailGetRoute } from "@/api/routes/admin/admin.merch-detail.get";
import { adminMerchUpdatePostRoute } from "@/api/routes/admin/admin.merch-update.post";
import { adminMerchGetRoute } from "@/api/routes/admin/admin.merch.get";
import { adminMountainChallengesGetRoute } from "@/api/routes/admin/admin.mountain-challenges.get";
import { adminMountainDeleteDeleteRoute } from "@/api/routes/admin/admin.mountain-delete.delete";
import { adminMountainDetailGetRoute } from "@/api/routes/admin/admin.mountain-detail.get";
import { adminMountainUpdatePostRoute } from "@/api/routes/admin/admin.mountain-update.post";
import { adminMountainsGetRoute } from "@/api/routes/admin/admin.mountains.get";
import { adminPlanDeleteDeleteRoute } from "@/api/routes/admin/admin.plan-delete.delete";
import { adminPlanDetailGetRoute } from "@/api/routes/admin/admin.plan-detail.get";
import { adminPlanMemberRemoveDeleteRoute } from "@/api/routes/admin/admin.plan-member-remove.delete";
import { adminPlanUpdatePostRoute } from "@/api/routes/admin/admin.plan-update.post";
import { adminPlansGetRoute } from "@/api/routes/admin/admin.plans.get";
import { adminStatsTimeseriesGetRoute } from "@/api/routes/admin/admin.stats-timeseries.get";
import { adminSummitDeleteDeleteRoute } from "@/api/routes/admin/admin.summit-delete.delete";
import { adminSummitDetailGetRoute } from "@/api/routes/admin/admin.summit-detail.get";
import { adminSummitUpdatePostRoute } from "@/api/routes/admin/admin.summit-update.post";
import { adminSummitsGetRoute } from "@/api/routes/admin/admin.summits.get";
import { adminUserDetailGetRoute } from "@/api/routes/admin/admin.user-detail.get";
import { adminUserPeopleGetRoute } from "@/api/routes/admin/admin.user-people.get";
import { adminUserPersonAddPostRoute } from "@/api/routes/admin/admin.user-person-add.post";
import { adminUserPersonRemoveDeleteRoute } from "@/api/routes/admin/admin.user-person-remove.delete";
import { adminUserSummitsGetRoute } from "@/api/routes/admin/admin.user-summits.get";
import { adminUserUpdatePostRoute } from "@/api/routes/admin/admin.user-update.post";
import { adminUsersGetRoute } from "@/api/routes/admin/admin.users.get";

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
  .use(adminUsersGetRoute)
  .use(adminUserDetailGetRoute)
  .use(adminUserUpdatePostRoute)
  .use(adminUserSummitsGetRoute)
  .use(adminUserPeopleGetRoute)
  .use(adminUserPersonAddPostRoute)
  .use(adminUserPersonRemoveDeleteRoute)
  .use(adminMountainsGetRoute)
  .use(adminMountainDetailGetRoute)
  .use(adminMountainUpdatePostRoute)
  .use(adminMountainDeleteDeleteRoute)
  .use(adminMountainChallengesGetRoute)
  .use(adminChallengesGetRoute)
  .use(adminChallengeDetailGetRoute)
  .use(adminChallengeUpdatePostRoute)
  .use(adminChallengeDeleteDeleteRoute)
  .use(adminChallengeMountainsGetRoute)
  .use(adminSummitsGetRoute)
  .use(adminSummitDetailGetRoute)
  .use(adminSummitUpdatePostRoute)
  .use(adminSummitDeleteDeleteRoute)
  .use(adminPlansGetRoute)
  .use(adminPlanDetailGetRoute)
  .use(adminPlanUpdatePostRoute)
  .use(adminPlanDeleteDeleteRoute)
  .use(adminPlanMemberRemoveDeleteRoute)
  .use(adminMerchGetRoute)
  .use(adminMerchDetailGetRoute)
  .use(adminMerchCreatePostRoute)
  .use(adminMerchUpdatePostRoute)
  .use(adminMerchDeleteDeleteRoute)
  .use(adminStatsTimeseriesGetRoute)
  .use(adminCronsGetRoute)
  .use(adminCronsTriggerPostRoute)
  .use(adminEmailTestPostRoute);
