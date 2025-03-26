import { cors } from "@elysiajs/cors";
import { Elysia, ParseError, ValidationError } from "elysia";

import { addRowToSheets, ERRORS_SPREADSHEET } from "@/api/lib/sheets";
import { protectedRoutes } from "@/api/routes/protected";
import { publicRoutes } from "@/api/routes/public";

export const app = new Elysia({ prefix: "/api" })
  .use(cors())
  .onError(({ request, error }) => {
    if (error instanceof ValidationError) {
      console.log(error.validator.Schema());
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
        JSON.stringify(error),
      ]);
    }
  })
  .use(publicRoutes)
  .use(protectedRoutes);

export type App = typeof app;
