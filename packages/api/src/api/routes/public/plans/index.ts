import { Elysia } from "elysia";

import { planAllGetRoute } from "@/api/routes/public/plans/plan.all.get";
import { planAllPaginatedGetRoute } from "@/api/routes/public/plans/plan.all-paginated.get";
import { planByMountainGetRoute } from "@/api/routes/public/plans/plan.by-mountain.get";
import { planCountNewGetRoute } from "@/api/routes/public/plans/plan.count-new.get";
import { planCountNewPostRoute } from "@/api/routes/public/plans/plan.count-new.post";
import { planOneGetRoute } from "@/api/routes/public/plans/plan.one.get";

export const publicPlansRoute = new Elysia({ prefix: "/plans" })
  .use(planAllGetRoute)
  .use(planAllPaginatedGetRoute)
  .use(planByMountainGetRoute)
  .use(planOneGetRoute)
  .use(planCountNewGetRoute)
  .use(planCountNewPostRoute);
