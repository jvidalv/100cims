import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { merchTable } from "@/db/schema";
import { MerchImageError, resolveMerchImageUrls } from "@/api/lib/merch-images";
import { AdminMerchUpdateBodySchema } from "@/api/schemas/admin.schema";
import {
  ErrorFieldResponse,
  SimpleSuccessResponse,
} from "@/api/schemas/common.schema";

export const adminMerchUpdatePostRoute = new Elysia().post(
  "/merch/:id",
  async ({ params, body, set }) => {
    try {
      // Slug is the stable identifier (used in suggestion logs and translation
      // keys). Disallow editing post-create even if the body sends one.
      const { slug, imageUrls, ...rest } = body;
      void slug;
      const resolvedImageUrls =
        imageUrls === undefined
          ? undefined
          : await resolveMerchImageUrls(imageUrls, params.id);

      const [row] = await db
        .update(merchTable)
        .set({
          ...rest,
          ...(resolvedImageUrls !== undefined && {
            imageUrls: resolvedImageUrls,
          }),
          updatedAt: new Date(),
        })
        .where(eq(merchTable.id, params.id))
        .returning({ id: merchTable.id });

      if (!row) {
        set.status = 404;
        return { error: "Merch not found" };
      }
      return { success: true };
    } catch (e) {
      if (e instanceof MerchImageError) {
        set.status = e.status;
        return { error: e.message };
      }
      const err = e as { code?: string; constraint?: string };
      if (err.code === "23505") {
        set.status = 409;
        return {
          error: `Conflict: ${err.constraint ?? "unique constraint"}`,
        };
      }
      throw e;
    }
  },
  {
    params: t.Object({ id: t.String() }),
    body: AdminMerchUpdateBodySchema,
    response: {
      200: SimpleSuccessResponse,
      400: ErrorFieldResponse,
      404: ErrorFieldResponse,
      409: ErrorFieldResponse,
      500: ErrorFieldResponse,
    },
  },
);
