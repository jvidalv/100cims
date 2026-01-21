import { Elysia } from "elysia";

import { db } from "@/db";
import { updateSeenTable } from "@/db/schema";
import { JWT } from "@/api/routes/@shared/jwt";
import { getStoreUser } from "@/api/routes/@shared/store";
import { SimpleSuccessResponse } from "@/api/schemas/common.schema";
import { MarkUpdateSeenBodySchema } from "@/api/schemas/update.schema";

export const markUpdateSeenRoute = new Elysia().use(JWT()).post(
  "/mark-update-seen",
  async ({ body, store }) => {
    const user = getStoreUser(store);

    await db
      .insert(updateSeenTable)
      .values({
        updateId: body.updateId,
        userId: user.id,
      })
      .onConflictDoNothing();

    return {
      success: true,
    };
  },
  {
    body: MarkUpdateSeenBodySchema,
    response: SimpleSuccessResponse,
  },
);
