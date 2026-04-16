import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { merchTable, merchVariantTable } from "@/db/schema";
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
      const { slug, imageUrls, variants, ...rest } = body;
      void slug;
      const resolvedImageUrls =
        imageUrls === undefined
          ? undefined
          : await resolveMerchImageUrls(imageUrls, params.id);

      const resolvedVariants =
        variants === undefined
          ? undefined
          : await Promise.all(
              variants.map(async (v) => ({
                color: v.color,
                imageUrls: await resolveMerchImageUrls(
                  v.imageUrls,
                  params.id,
                  v.color,
                ),
              })),
            );

      const updated = await db.transaction(async (tx) => {
        const [row] = await tx
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

        if (!row) return null;

        if (resolvedVariants !== undefined) {
          await tx
            .delete(merchVariantTable)
            .where(eq(merchVariantTable.merchId, params.id));
          if (resolvedVariants.length) {
            await tx.insert(merchVariantTable).values(
              resolvedVariants.map((v) => ({
                merchId: params.id,
                color: v.color,
                imageUrls: v.imageUrls,
              })),
            );
          }
        }

        return row;
      });

      if (!updated) {
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
