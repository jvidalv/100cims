import { eq, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { mountainTable, summitTable } from "@/db/schema";
import {
  ErrorFieldResponse,
  SimpleSuccessResponse,
} from "@/api/schemas/common.schema";

export const adminSummitResetImageRoute = new Elysia().post(
  "/summits/:id/reset-image",
  async ({ params, set }) => {
    const [summit] = await db
      .select({
        id: summitTable.id,
        mountainId: summitTable.mountainId,
      })
      .from(summitTable)
      .where(eq(summitTable.id, params.id))
      .limit(1);

    if (!summit) {
      set.status = 404;
      return { error: "Summit not found" };
    }

    const [mountain] = summit.mountainId
      ? await db
          .select({ imageUrl: mountainTable.imageUrl })
          .from(mountainTable)
          .where(eq(mountainTable.id, summit.mountainId))
          .limit(1)
      : [];

    if (!mountain?.imageUrl) {
      set.status = 400;
      return { error: "No image available on the linked mountain" };
    }

    await db
      .update(summitTable)
      .set({
        imageUrl: mountain.imageUrl,
        photoVersion: sql`${summitTable.photoVersion} + 1`,
      })
      .where(eq(summitTable.id, params.id));

    return { success: true };
  },
  {
    params: t.Object({ id: t.String() }),
    response: {
      200: SimpleSuccessResponse,
      400: ErrorFieldResponse,
      404: ErrorFieldResponse,
    },
  },
);
