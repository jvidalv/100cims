import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { Elysia, NotFoundError, ParseError, ValidationError } from "elysia";

import { cronJobs } from "@/api/cron";
import {
  DISCORD_COLOR,
  DISCORD_ERRORS_WEBHOOK_URL,
  sendDiscordEmbed,
  truncate,
} from "@/api/lib/discord";
import { addRowToSheets, ERRORS_SPREADSHEET } from "@/api/lib/sheets";
import { adminRoutes } from "@/api/routes/admin";
import { healthGetRoute } from "@/api/routes/health.get";
import { protectedRoutes } from "@/api/routes/protected";
import { publicRoutes } from "@/api/routes/public";

export const app = new Elysia({ prefix: "/api" })
  .use(cors())
  .use(
    swagger({
      documentation: {
        info: {
          title: "Cims API",
          version: "1.0.0",
          description: "API for Cims mountain tracking application",
        },
        tags: [
          { name: "health", description: "Health check endpoints" },
          { name: "auth", description: "Authentication endpoints" },
          { name: "mountains", description: "Mountain data endpoints" },
          { name: "summits", description: "Summit tracking endpoints" },
          { name: "users", description: "User management endpoints" },
          { name: "challenges", description: "Challenge endpoints" },
          {
            name: "community-challenges",
            description: "Community challenge endpoints",
          },
          { name: "hiscores", description: "Leaderboard endpoints" },
          { name: "plans", description: "Plan management endpoints" },
          { name: "donations", description: "Donation endpoints" },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "JWT",
            },
          },
        },
      },
      path: "/swagger",
    }),
  )
  .onError(({ request, error, code, set }) => {
    if (error instanceof NotFoundError || code === "NOT_FOUND") {
      set.status = 404;
      return { error: "Not found" };
    }
    console.log(error);
    const sendErrorEmbed = (
      type: string,
      status: string | number,
      message: string,
    ) => {
      sendDiscordEmbed(DISCORD_ERRORS_WEBHOOK_URL, {
        title: "API error",
        color: DISCORD_COLOR.RED,
        fields: [
          { name: "Type", value: type, inline: true },
          { name: "Status", value: String(status), inline: true },
          { name: "URL", value: truncate(request.url, 200) },
          { name: "Message", value: truncate(message) },
        ],
      });
    };
    if (error instanceof ValidationError) {
      void addRowToSheets(ERRORS_SPREADSHEET, [
        "validation",
        error.status,
        request.url,
        error.message,
      ]);
      sendErrorEmbed("validation", error.status, error.message);
    } else if (error instanceof ParseError) {
      void addRowToSheets(ERRORS_SPREADSHEET, [
        "parse",
        error.status,
        request.url,
        error.message,
      ]);
      sendErrorEmbed("parse", error.status, error.message);
    } else {
      const details =
        error instanceof Error
          ? `${error.name}: ${error.message}\n${error.stack || ""}`
          : String(error);
      void addRowToSheets(ERRORS_SPREADSHEET, [
        "generic",
        `assumed 500`,
        request.url,
        details,
      ]);
      sendErrorEmbed("generic", "assumed 500", details);
    }
  })
  .use(cronJobs)
  .use(healthGetRoute)
  .use(publicRoutes)
  .use(protectedRoutes)
  .use(adminRoutes);

export type App = typeof app;
