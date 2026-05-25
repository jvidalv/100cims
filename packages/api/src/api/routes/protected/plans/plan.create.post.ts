import { Elysia, t } from "elysia";

import { db } from "@/db";
import {
  planTable,
  planHasUsersTable,
  planHasMountainsTable,
  planUserLogTable,
} from "@/db/schema";
import { formatDateForPostgresFromISOString } from "@/api/lib/dates";
import { notifyFriendsOfNewPlan } from "@/api/lib/notify-friends-of-new-plan";
import { notifyUsersWithSavedMountains } from "@/api/lib/plan-saved-mountain-notify";
import { getUserFromRequest } from "@/api/routes/@shared/auth";
import { resolveChallengeId } from "@/api/routes/@shared/challenge";
import { SuccessResponse } from "@/api/schemas/common.schema";
import { PlanTypeSchema } from "@/api/schemas/enums";
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
          startTime: body.startTime ?? null,
          type: body.type ?? "hike",
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

      const extraUserIds = Array.from(
        new Set((body.userIds ?? []).filter((id) => id !== user.id)),
      );

      if (extraUserIds.length) {
        await tx.insert(planHasUsersTable).values(
          extraUserIds.map((id) => ({
            userId: id,
            planId: plan.id,
            willBringDogs: false,
          })),
        );

        await tx.insert(planUserLogTable).values(
          extraUserIds.map((id) => ({
            planId: plan.id,
            userId: id,
            action: "joined",
          })),
        );
      }

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

    if (!insertedPlan.isPrivate && body.mountainIds?.length) {
      void notifyUsersWithSavedMountains({
        planId: insertedPlan.id,
        planTitle: insertedPlan.title,
        creator: user,
        mountainIds: body.mountainIds,
      });
    }

    if (!insertedPlan.isPrivate) {
      void notifyFriendsOfNewPlan({
        planId: insertedPlan.id,
        planTitle: insertedPlan.title,
        creator: user,
        excludeUserIds: body.userIds,
      });
    }

    return { success: true, message: insertedPlan };
  },
  {
    body: t.Object({
      title: t.String(),
      description: t.String(),
      startDate: t.Optional(t.String()),
      startTime: t.Optional(t.String()),
      type: t.Optional(PlanTypeSchema),
      mountainIds: t.Optional(t.Array(t.String())),
      userIds: t.Optional(t.Array(t.String())),
      challengeId: t.Optional(t.String()),
      isPrivate: t.Optional(t.Boolean()),
    }),
    response: SuccessResponse(BasicPlanSchema),
  },
);
