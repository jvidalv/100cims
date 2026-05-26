import { and, eq, inArray } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { PLAN_USER_LOG_ACTIONS } from "@/db/enums";
import { PlanStatusSchema, PlanTypeSchema } from "@/api/schemas/enums";
import {
  planTable,
  planHasUsersTable,
  planHasMountainsTable,
  planUserLogTable,
} from "@/db/schema";
import { formatDateForPostgresFromISOString } from "@/api/lib/dates";
import {
  findInvalidPlanLinkUrl,
  normalizePlanLinkUrl,
} from "@/api/lib/plan-link-urls";
import { getUserFromRequest } from "@/api/routes/@shared/auth";
import {
  SuccessResponse,
  ErrorFieldResponse,
} from "@/api/schemas/common.schema";
import {
  BasicPlanSchema,
  PlanLinkUrlErrorResponse,
} from "@/api/schemas/plan.schema";

export const planUpdatePostRoute = new Elysia().post(
  "/update",
  async ({ body, request, set }) => {
    const user = getUserFromRequest(request);

    const existing = await db
      .select({ creatorId: planTable.creatorId })
      .from(planTable)
      .where(eq(planTable.id, body.id))
      .limit(1);

    if (!existing.length || existing[0].creatorId !== user.id) {
      set.status = 403;
      return { error: "Not authorized to update this plan" };
    }

    const whatsappGroupUrl =
      body.whatsappGroupUrl !== undefined
        ? normalizePlanLinkUrl(body.whatsappGroupUrl)
        : undefined;
    const wikilocUrl =
      body.wikilocUrl !== undefined
        ? normalizePlanLinkUrl(body.wikilocUrl)
        : undefined;
    const stravaUrl =
      body.stravaUrl !== undefined
        ? normalizePlanLinkUrl(body.stravaUrl)
        : undefined;

    const invalidField = findInvalidPlanLinkUrl({
      whatsappGroupUrl,
      wikilocUrl,
      stravaUrl,
    });
    if (invalidField) {
      set.status = 400;
      return { error: "INVALID_URL" as const, field: invalidField };
    }

    const updated = await db.transaction(async (tx) => {
      const [plan] = await tx
        .update(planTable)
        .set({
          title: body.title,
          description: body.description,
          status: body.status,
          imageUrl: body.imageUrl ?? undefined,
          routeUrl: body.routeUrl ?? undefined,
          whatsappGroupUrl,
          wikilocUrl,
          stravaUrl,
          startDate: body.startDate
            ? formatDateForPostgresFromISOString(body.startDate)
            : undefined,
          startTime: body.startTime,
          type: body.type,
          isPrivate: body.isPrivate,
          updatedAt: new Date(),
        })
        .where(eq(planTable.id, body.id))
        .returning();

      if (body.mountainIds) {
        await tx
          .delete(planHasMountainsTable)
          .where(eq(planHasMountainsTable.planId, body.id));

        if (body.mountainIds.length) {
          await tx.insert(planHasMountainsTable).values(
            body.mountainIds.map((mountainId) => ({
              planId: body.id,
              mountainId,
            })),
          );
        }
      }

      if (body.userIds) {
        const current = await tx
          .select({ userId: planHasUsersTable.userId })
          .from(planHasUsersTable)
          .where(eq(planHasUsersTable.planId, body.id))
          .execute();

        const currentIds = current
          .map((u) => u.userId)
          .filter((id) => id !== user.id) as string[];
        const nextIds = body.userIds.filter((id) => id !== user.id);

        const toAdd = nextIds.filter((id) => !currentIds.includes(id));
        const toRemove = currentIds.filter((id) => !nextIds.includes(id));

        if (toRemove.length) {
          await tx
            .delete(planHasUsersTable)
            .where(
              and(
                eq(planHasUsersTable.planId, body.id),
                inArray(planHasUsersTable.userId, toRemove),
              ),
            );

          await tx.insert(planUserLogTable).values(
            toRemove.map((id) => ({
              planId: body.id,
              userId: id,
              action: PLAN_USER_LOG_ACTIONS.LEFT,
            })),
          );
        }

        if (toAdd.length) {
          await tx.insert(planHasUsersTable).values(
            toAdd.map((id) => ({
              planId: body.id,
              userId: id,
              willBringDogs: false,
            })),
          );

          await tx.insert(planUserLogTable).values(
            toAdd.map((id) => ({
              planId: body.id,
              userId: id,
              action: PLAN_USER_LOG_ACTIONS.JOINED,
            })),
          );
        }
      }

      return plan;
    });

    return { success: true, message: updated };
  },
  {
    body: t.Object({
      id: t.String(),
      title: t.Optional(t.String()),
      description: t.Optional(t.String()),
      imageUrl: t.Optional(t.String()),
      status: t.Optional(PlanStatusSchema),
      routeUrl: t.Optional(t.String()),
      startDate: t.Optional(t.String()),
      startTime: t.Optional(t.Nullable(t.String())),
      type: t.Optional(t.Nullable(PlanTypeSchema)),
      mountainIds: t.Optional(t.Array(t.String())),
      userIds: t.Optional(t.Array(t.String())),
      isPrivate: t.Optional(t.Boolean()),
      whatsappGroupUrl: t.Optional(t.Nullable(t.String())),
      wikilocUrl: t.Optional(t.Nullable(t.String())),
      stravaUrl: t.Optional(t.Nullable(t.String())),
    }),
    response: {
      200: SuccessResponse(BasicPlanSchema),
      400: PlanLinkUrlErrorResponse,
      403: ErrorFieldResponse,
    },
  },
);
