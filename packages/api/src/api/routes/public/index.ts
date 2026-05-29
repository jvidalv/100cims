import { Elysia } from "elysia";

import { challengeRoutes } from "@/api/routes/public/challenge";
import { contactPostRoute } from "@/api/routes/public/contact.post";
import { hiscoresRoutes } from "@/api/routes/public/hiscores";
import { joinPostRoute } from "@/api/routes/public/join.post";
import { logErrorPostRoute } from "@/api/routes/public/log-error.post";
import { publicMerchRoute } from "@/api/routes/public/merch";
import { mountainCommentsPublicRoute } from "@/api/routes/public/mountain-comments";
import { mountainsRoutes } from "@/api/routes/public/mountains";
import { publicOrganizationsRoute } from "@/api/routes/public/organizations";
import { publicPlansRoute } from "@/api/routes/public/plans";
import { resubscribePostRoute } from "@/api/routes/public/resubscribe.post";
import { unsubscribePostRoute } from "@/api/routes/public/unsubscribe.post";
import { publicUserRoute } from "@/api/routes/public/user";

export const publicRoutes = new Elysia({ prefix: "/public" })
  .use(mountainsRoutes)
  .use(mountainCommentsPublicRoute)
  .use(joinPostRoute)
  .use(contactPostRoute)
  .use(logErrorPostRoute)
  .use(hiscoresRoutes)
  .use(challengeRoutes)
  .use(publicUserRoute)
  .use(publicPlansRoute)
  .use(publicOrganizationsRoute)
  .use(publicMerchRoute)
  .use(unsubscribePostRoute)
  .use(resubscribePostRoute);
