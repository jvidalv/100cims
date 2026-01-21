import { Elysia, t } from "elysia";

import { addRowToSheets, SUGGESTIONS_SPREADSHEET } from "@/api/lib/sheets";
import { JWT } from "@/api/routes/@shared/jwt";
import { getStoreUser } from "@/api/routes/@shared/store";
import { SimpleSuccessResponse } from "@/api/schemas/common.schema";

export const suggestionRoute = new Elysia().use(JWT()).post(
  "/suggestion",
  async ({ body, store }) => {
    const user = getStoreUser(store);
    await addRowToSheets(SUGGESTIONS_SPREADSHEET, [user.email, body.suggestion]);
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
