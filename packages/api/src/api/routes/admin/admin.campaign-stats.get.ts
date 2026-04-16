import { Elysia, t } from "elysia";

import { countEligible, countReached, getCampaign } from "@/api/lib/campaigns";
import {
  ErrorFieldResponse,
  SuccessResponse,
} from "@/api/schemas/common.schema";

export const adminCampaignStatsGetRoute = new Elysia().get(
  "/campaigns/:slug/stats",
  async ({ params, set }) => {
    const campaign = getCampaign(params.slug);
    if (!campaign) {
      set.status = 404;
      return { error: "Unknown campaign" };
    }
    const [reached, eligibleRemaining] = await Promise.all([
      countReached(campaign.slug),
      countEligible(campaign),
    ]);
    return {
      success: true,
      message: {
        slug: campaign.slug,
        description: campaign.audience.description,
        reached,
        eligibleRemaining,
      },
    };
  },
  {
    params: t.Object({
      slug: t.Union([t.Literal("reengage_cold"), t.Literal("reengage_summer")]),
    }),
    response: {
      200: SuccessResponse(
        t.Object({
          slug: t.String(),
          description: t.String(),
          reached: t.Number(),
          eligibleRemaining: t.Number(),
        }),
      ),
      404: ErrorFieldResponse,
    },
  },
);
