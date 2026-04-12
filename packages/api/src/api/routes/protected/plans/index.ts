import { Elysia } from "elysia";

import { planCreatePostRoute } from "@/api/routes/protected/plans/plan.create.post";
import { planDeletePostRoute } from "@/api/routes/protected/plans/plan.delete.post";
import { planJoinPostRoute } from "@/api/routes/protected/plans/plan.join.post";
import { planLeavePostRoute } from "@/api/routes/protected/plans/plan.leave.post";
import { planUpdatePostRoute } from "@/api/routes/protected/plans/plan.update.post";

export const plansRoute = new Elysia({ prefix: "/plans" })
  .use(planCreatePostRoute)
  .use(planUpdatePostRoute)
  .use(planDeletePostRoute)
  .use(planJoinPostRoute)
  .use(planLeavePostRoute);
