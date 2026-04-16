import { Elysia, t } from "elysia";

import { getCampaign, runCampaignBatch } from "@/api/lib/campaigns";
import {
  ErrorFieldResponse,
  SuccessResponse,
} from "@/api/schemas/common.schema";

export const adminCampaignTriggerPostRoute = new Elysia().post(
  "/campaigns/:slug/trigger",
  async ({ params, body, set }) => {
    const campaign = getCampaign(params.slug);
    if (!campaign) {
      set.status = 404;
      return { error: "Unknown campaign" };
    }
    const result = await runCampaignBatch(campaign, body.batchSize);
    return { success: true, message: result };
  },
  {
    params: t.Object({
      slug: t.Union([t.Literal("reengage_cold"), t.Literal("reengage_summer")]),
    }),
    body: t.Object({
      batchSize: t.Integer({ minimum: 1, maximum: 500 }),
    }),
    response: {
      200: SuccessResponse(
        t.Object({
          attempted: t.Number(),
          sent: t.Number(),
          failed: t.Number(),
        }),
      ),
      404: ErrorFieldResponse,
    },
  },
);
