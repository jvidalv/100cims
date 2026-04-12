import { Elysia, t } from "elysia";

import {
  DISCORD_COLOR,
  DISCORD_CONTACT_WEBHOOK_URL,
  sendDiscordEmbed,
  truncate,
} from "@/api/lib/discord";
import { addRowToSheets, SUGGESTIONS_SPREADSHEET } from "@/api/lib/sheets";
import { SimpleSuccessResponse } from "@/api/schemas/common.schema";

export const contactPostRoute = new Elysia().post(
  "/contact",
  async ({ body }) => {
    await addRowToSheets(SUGGESTIONS_SPREADSHEET, [
      body.email,
      body.message,
      body.name ?? "",
    ]);
    sendDiscordEmbed(DISCORD_CONTACT_WEBHOOK_URL, {
      title: "New contact message",
      color: DISCORD_COLOR.YELLOW,
      fields: [
        { name: "From", value: body.email, inline: true },
        { name: "Name", value: body.name || "—", inline: true },
        { name: "Message", value: truncate(body.message) },
      ],
    });
    return { success: true };
  },
  {
    body: t.Object({
      email: t.String({ format: "email", maxLength: 200 }),
      name: t.Optional(t.String({ maxLength: 100 })),
      message: t.String({ minLength: 1, maxLength: 4000 }),
    }),
    response: SimpleSuccessResponse,
  },
);
