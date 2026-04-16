import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { mountainTable } from "@/db/schema";
import { getUserFromRequest } from "@/api/routes/@shared/auth";
import {
  ErrorFieldResponse,
  SimpleSuccessResponse,
} from "@/api/schemas/common.schema";

export const mountainDeletePostRoute = new Elysia().post(
  "/delete",
  async ({ body, request, set }) => {
    const user = getUserFromRequest(request);

    const [existing] = await db
      .select({
        id: mountainTable.id,
        creatorId: mountainTable.creatorId,
      })
      .from(mountainTable)
      .where(eq(mountainTable.id, body.id))
      .limit(1);

    if (!existing) {
      set.status = 404;
      return { error: "Mountain not found" };
    }

    if (existing.creatorId !== user.id) {
      set.status = 403;
      return { error: "Not authorized to delete this mountain" };
    }

    await db.delete(mountainTable).where(eq(mountainTable.id, body.id));

    return { success: true };
  },
  {
    body: t.Object({ id: t.String() }),
    response: {
      200: SimpleSuccessResponse,
      403: ErrorFieldResponse,
      404: ErrorFieldResponse,
    },
  },
);
