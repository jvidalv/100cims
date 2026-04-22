import { Elysia, t } from "elysia";

import { db } from "@/db";
import {
  planTable,
  planHasUsersTable,
  planHasMountainsTable,
} from "@/db/schema";
import { formatDateForPostgresFromISOString } from "@/api/lib/dates";
import { getUserFromRequest } from "@/api/routes/@shared/auth";
import { resolveChallengeId } from "@/api/routes/@shared/challenge";
import { SuccessResponse } from "@/api/schemas/common.schema";
import { BasicPlanSchema } from "@/api/schemas/plan.schema";

export const planCreatePostRoute = new Elysia().post(
  "/create",
  async ({ body, request }) => {
    const user = getUserFromRequest(request);
    const challengeId = resolveChallengeId(body.challengeId, user);

    const insertedPlan = await db.transaction(async (tx) => {
      const [plan] = await tx
        .insert(planTable)
        .values({
          creatorId: user.id,
          title: body.title,
          description: body.description,
          startDate: body.startDate
            ? formatDateForPostgresFromISOString(body.startDate)
            : null,
          speed: "normal",
          status: "open",
          challengeId,
          isPrivate: body.isPrivate ?? false,
        })
        .returning();

      await tx.insert(planHasUsersTable).values({
        userId: user.id,
        planId: plan.id,
        willBringDogs: false,
      });

      if (body.mountainIds?.length) {
        await tx.insert(planHasMountainsTable).values(
          body.mountainIds.map((mountainId) => ({
            planId: plan.id,
            mountainId,
          })),
        );
      }

      return plan;
    });

    return { success: true, message: insertedPlan };
  },
  {
    body: t.Object({
      title: t.String(),
      description: t.String(),
      startDate: t.Optional(t.String()),
      mountainIds: t.Optional(t.Array(t.String())),
      challengeId: t.Optional(t.String()),
      isPrivate: t.Optional(t.Boolean()),
    }),
    response: SuccessResponse(BasicPlanSchema),
  },
);
