import { Elysia, t } from "elysia";

import {
  DISCORD_COLOR,
  DISCORD_ERRORS_WEBHOOK_URL,
  sendDiscordEmbed,
  truncate,
} from "@/api/lib/discord";
import { resolveCountryFromRequest } from "@/api/lib/geoip";
import {
  resolveAppVersionFromRequest,
  resolvePlatformFromRequest,
} from "@/api/lib/request-headers";
import { SimpleSuccessResponse } from "@/api/schemas/common.schema";

export const logErrorPostRoute = new Elysia().post(
  "/log-error",
  ({ body, request }) => {
    const country = resolveCountryFromRequest(request);
    const platform =
      body.platform ?? resolvePlatformFromRequest(request) ?? "—";
    const appVersion =
      body.appVersion ?? resolveAppVersionFromRequest(request) ?? "—";

    sendDiscordEmbed(DISCORD_ERRORS_WEBHOOK_URL, {
      title: "App client error",
      color: DISCORD_COLOR.RED,
      fields: [
        { name: "Message", value: truncate(body.message) },
        ...(body.stack ? [{ name: "Stack", value: truncate(body.stack) }] : []),
        ...(body.route
          ? [{ name: "Route", value: truncate(body.route, 200), inline: true }]
          : []),
        { name: "Platform", value: platform, inline: true },
        { name: "App version", value: appVersion, inline: true },
        { name: "Country", value: country ?? "—", inline: true },
      ],
    });

    return { success: true };
  },
  {
    body: t.Object({
      message: t.String(),
      stack: t.Optional(t.String()),
      appVersion: t.Optional(t.String()),
      platform: t.Optional(t.String()),
      route: t.Optional(t.String()),
    }),
    response: SimpleSuccessResponse,
  },
);
