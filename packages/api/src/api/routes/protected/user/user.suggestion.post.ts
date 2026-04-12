import { Elysia, t } from "elysia";

import { addRowToSheets, SUGGESTIONS_SPREADSHEET } from "@/api/lib/sheets";
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
