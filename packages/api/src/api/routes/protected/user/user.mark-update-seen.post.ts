import { Elysia } from "elysia";

import { db } from "@/db";
import { updateSeenTable } from "@/db/schema";
import { getUserFromRequest } from "@/api/routes/@shared/auth";
import { SimpleSuccessResponse } from "@/api/schemas/common.schema";
import { MarkUpdateSeenBodySchema } from "@/api/schemas/update.schema";

export const userMarkUpdateSeenPostRoute = new Elysia().post(
  "/mark-update-seen",
  async ({ body, request }) => {
    const user = getUserFromRequest(request);

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
