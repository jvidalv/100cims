import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { Elysia, ParseError, ValidationError } from "elysia";

import { addRowToSheets, ERRORS_SPREADSHEET } from "@/api/lib/sheets";
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
  .onError(({ request, error }) => {
    if (error instanceof ValidationError) {
      void addRowToSheets(ERRORS_SPREADSHEET, [
        "validation",
        error.status,
        request.url,
        error.message,
      ]);
    } else if (error instanceof ParseError) {
      void addRowToSheets(ERRORS_SPREADSHEET, [
        "parse",
        error.status,
        request.url,
        error.message,
      ]);
    } else {
      void addRowToSheets(ERRORS_SPREADSHEET, [
        "generic",
        `assumed 500`,
        request.url,
        error instanceof Error
          ? `${error.name}: ${error.message}\n${error.stack || ""}`
          : String(error),
      ]);
    }
  })
  .use(publicRoutes)
  .use(protectedRoutes);

export type App = typeof app;
