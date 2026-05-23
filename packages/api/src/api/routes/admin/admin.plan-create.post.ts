import { Elysia, t } from "elysia";
import { uuidv7 } from "uuidv7";

import { db } from "@/db";
import {
  planHasMountainsTable,
  planHasUsersTable,
  planTable,
} from "@/db/schema";
import { CimsUserNotSeededError, getCimsUserId } from "@/api/lib/cims-user";
import { formatDateForPostgresFromISOString } from "@/api/lib/dates";
import { PlanImageError, resolvePlanImageUrl } from "@/api/lib/plan-images";
import { DEFAULT_CHALLENGE_ID } from "@/api/routes/@shared/challenge";
import { getAdminUserId } from "@/api/routes/admin/admin-context";
import { AdminPlanCreateBodySchema } from "@/api/schemas/admin.schema";
import {
  ErrorFieldResponse,
  SuccessResponse,
} from "@/api/schemas/common.schema";

export const adminPlanCreatePostRoute = new Elysia().post(
  "/plans",
  async ({ body, request, set }) => {
    // S3 keys need a stable id; generate upfront so the upload can happen
    // before the row exists, mirroring admin.merch-create.post.ts.
    const planId = uuidv7();

    let creatorId: string;
    let imageUrl: string | null;
    try {
      creatorId = body.publishAsCims
        ? await getCimsUserId()
        : getAdminUserId(request);
      imageUrl = await resolvePlanImageUrl(body.imageUrl, planId);
    } catch (e) {
      if (e instanceof CimsUserNotSeededError) {
        set.status = 500;
        return { error: e.message };
      }
      if (e instanceof PlanImageError) {
        set.status = e.status;
        return { error: e.message };
      }
      throw e;
    }

    await db.transaction(async (tx) => {
      await tx.insert(planTable).values({
        id: planId,
        creatorId,
        title: body.title,
        description: body.description ?? null,
        imageUrl,
        startDate: body.startDate
          ? formatDateForPostgresFromISOString(body.startDate)
          : null,
        startTime: body.startTime ?? null,
        type: body.type ?? null,
        speed: body.speed ?? "normal",
        status: "open",
        challengeId: body.challengeId ?? DEFAULT_CHALLENGE_ID,
        isPrivate: body.isPrivate ?? false,
      });

      await tx.insert(planHasUsersTable).values({
        planId,
        userId: creatorId,
        willBringDogs: false,
      });

      if (body.mountainIds?.length) {
        await tx.insert(planHasMountainsTable).values(
          body.mountainIds.map((mountainId) => ({
            planId,
            mountainId,
          })),
        );
      }
    });

    return { success: true, message: { id: planId } };
  },
  {
    body: AdminPlanCreateBodySchema,
    response: {
      200: SuccessResponse(t.Object({ id: t.String() })),
      400: ErrorFieldResponse,
      500: ErrorFieldResponse,
    },
  },
);
