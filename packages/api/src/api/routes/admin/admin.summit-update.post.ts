import { eq, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { mountainTable, summitTable } from "@/db/schema";
import { AdminSummitUpdateBodySchema } from "@/api/schemas/admin.schema";
import {
  ErrorFieldResponse,
  SimpleSuccessResponse,
} from "@/api/schemas/common.schema";

export const adminSummitUpdatePostRoute = new Elysia().post(
  "/summits/:id",
  async ({ params, body, set }) => {
    try {
      const patch = { ...body };

      // Admin cleared the image → fall back to the mountain's own imageUrl
      // so we never write an empty string (summit.imageUrl is NOT NULL).
      if (patch.imageUrl !== undefined && patch.imageUrl.trim() === "") {
        const targetMountainId =
          patch.mountainId !== undefined
            ? patch.mountainId
            : (
                await db
                  .select({ mountainId: summitTable.mountainId })
                  .from(summitTable)
                  .where(eq(summitTable.id, params.id))
                  .limit(1)
              )[0]?.mountainId;

        const fallback = targetMountainId
          ? (
              await db
                .select({ imageUrl: mountainTable.imageUrl })
                .from(mountainTable)
                .where(eq(mountainTable.id, targetMountainId))
                .limit(1)
            )[0]?.imageUrl
          : null;

        if (!fallback) {
          set.status = 400;
          return { error: "No image available on the linked mountain" };
        }
        patch.imageUrl = fallback;
      }

      const [row] = await db
        .update(summitTable)
        .set({
          ...patch,
          ...(patch.imageUrl !== undefined
            ? { photoVersion: sql`${summitTable.photoVersion} + 1` }
            : {}),
        })
        .where(eq(summitTable.id, params.id))
        .returning({ id: summitTable.id });

      if (!row) {
        set.status = 404;
        return { error: "Summit not found" };
      }
      return { success: true };
    } catch (e) {
      const err = e as { code?: string; constraint?: string };
      if (err.code === "23503") {
        set.status = 400;
        return {
          error: `Invalid reference: ${err.constraint ?? "foreign key"}`,
        };
      }
      throw e;
    }
  },
  {
    params: t.Object({ id: t.String() }),
    body: AdminSummitUpdateBodySchema,
    response: {
      200: SimpleSuccessResponse,
      400: ErrorFieldResponse,
      404: ErrorFieldResponse,
    },
  },
);
