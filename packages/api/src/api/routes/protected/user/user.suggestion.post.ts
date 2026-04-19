import { Elysia, t } from "elysia";

import {
  DISCORD_COLOR,
  DISCORD_CONTACT_WEBHOOK_URL,
  sendDiscordEmbed,
  truncate,
} from "@/api/lib/discord";
import { addRowToSheets, SUGGESTIONS_SPREADSHEET } from "@/api/lib/sheets";
import {
  createShopRequest,
  MERCH_MESSAGE_PREFIX,
} from "@/api/lib/shop-request";
import { getUserFromRequest } from "@/api/routes/@shared/auth";
import { SimpleSuccessResponse } from "@/api/schemas/common.schema";

export const userSuggestionPostRoute = new Elysia().post(
  "/suggestion",
  async ({ body, request }) => {
    const user = getUserFromRequest(request);
    await addRowToSheets(SUGGESTIONS_SPREADSHEET, [
      user.email,
      body.suggestion,
    ]);
    sendDiscordEmbed(DISCORD_CONTACT_WEBHOOK_URL, {
      title: "New suggestion",
      color: DISCORD_COLOR.YELLOW,
      fields: [
        { name: "From", value: user.email, inline: true },
        { name: "Message", value: truncate(body.suggestion) },
      ],
    });

    // Shipped mobile clients route cart submits through this endpoint with a
    // `[MERCH ORDER]` prefix. Mirror those into the dedicated shop_request
    // table so the admin UI has a source of truth, without shipping a new app.
    if (body.suggestion.startsWith(MERCH_MESSAGE_PREFIX)) {
      try {
        await createShopRequest({
          userId: user.id,
          userEmail: user.email,
          message: body.suggestion,
        });
      } catch (err) {
        console.warn("[suggestion] shop-request mirror failed", err);
      }
    }

    return {
      success: true,
    };
  },
  {
    body: t.Object({
      suggestion: t.String(),
    }),
    response: SimpleSuccessResponse,
  },
);
