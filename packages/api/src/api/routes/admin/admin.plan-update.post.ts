import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { planTable } from "@/db/schema";
import {
  findInvalidPlanLinkUrl,
  normalizePlanLinkUrl,
} from "@/api/lib/plan-link-urls";
import { AdminPlanUpdateBodySchema } from "@/api/schemas/admin.schema";
import {
  ErrorFieldResponse,
  SimpleSuccessResponse,
} from "@/api/schemas/common.schema";
import { PlanLinkUrlErrorResponse } from "@/api/schemas/plan.schema";

export const adminPlanUpdatePostRoute = new Elysia().post(
  "/plans/:id",
  async ({ params, body, set }) => {
    // Normalize blank → null and reject malformed URLs before persisting so
    // /admin can't poison rows in ways the public route would refuse.
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

    const [row] = await db
      .update(planTable)
      .set({
        ...body,
        whatsappGroupUrl,
        wikilocUrl,
        stravaUrl,
        updatedAt: new Date(),
      })
      .where(eq(planTable.id, params.id))
      .returning({ id: planTable.id });

    if (!row) {
      set.status = 404;
      return { error: "Plan not found" };
    }
    return { success: true };
  },
  {
    params: t.Object({ id: t.String() }),
    body: AdminPlanUpdateBodySchema,
    response: {
      200: SimpleSuccessResponse,
      400: PlanLinkUrlErrorResponse,
      404: ErrorFieldResponse,
    },
  },
);
