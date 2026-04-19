import { Elysia, t } from "elysia";
import { uuidv7 } from "uuidv7";

import { db } from "@/db";
import { merchTable, merchVariantTable } from "@/db/schema";
import { MerchImageError, resolveMerchImageUrls } from "@/api/lib/merch-images";
import { MERCH_SIZES } from "@/api/lib/merch-sizes";
import { AdminMerchCreateBodySchema } from "@/api/schemas/admin.schema";
import {
  ErrorFieldResponse,
  SuccessResponse,
} from "@/api/schemas/common.schema";

export const adminMerchCreatePostRoute = new Elysia().post(
  "/merch",
  async ({ body, set }) => {
    try {
      // S3 keys need a stable id; generate it upfront so we can upload before
      // the row exists, avoiding a half-created row if S3 fails.
      const id = uuidv7();
      const imageUrls = await resolveMerchImageUrls(body.imageUrls ?? [], id);

      const resolvedVariants = await Promise.all(
        (body.variants ?? []).map(async (v) => ({
          color: v.color,
          imageUrls: await resolveMerchImageUrls(v.imageUrls, id, v.color),
        })),
      );

      // hasSize stays authoritative: if the client sent a sizes array, it
      // supersedes any explicit hasSize they also sent. Old clients that only
      // send hasSize still work.
      const sizes = body.sizes ?? [];
      const hasSize =
        body.sizes !== undefined ? sizes.length > 0 : (body.hasSize ?? false);

      await db.transaction(async (tx) => {
        await tx.insert(merchTable).values({
          id,
          slug: body.slug,
          nameEn: body.nameEn,
          nameCa: body.nameCa ?? null,
          nameEs: body.nameEs ?? null,
          descriptionEn: body.descriptionEn ?? null,
          descriptionCa: body.descriptionCa ?? null,
          descriptionEs: body.descriptionEs ?? null,
          shopUrl: body.shopUrl ?? null,
          price: body.price,
          discountedPrice: body.discountedPrice ?? null,
          hasSize,
          sizes,
          featured: body.featured ?? null,
          active: body.active ?? true,
          imageUrls,
        });
        if (resolvedVariants.length) {
          await tx.insert(merchVariantTable).values(
            resolvedVariants.map((v) => ({
              merchId: id,
              color: v.color,
              imageUrls: v.imageUrls,
            })),
          );
        }
      });

      return { success: true, message: { id } };
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
      if (err.code === "23514" && err.constraint === "merch_sizes_check") {
        set.status = 400;
        return {
          error: `Invalid size — must be one of ${MERCH_SIZES.join(", ")}.`,
        };
      }
      throw e;
    }
  },
  {
    body: AdminMerchCreateBodySchema,
    response: {
      200: SuccessResponse(t.Object({ id: t.String() })),
      400: ErrorFieldResponse,
      409: ErrorFieldResponse,
      500: ErrorFieldResponse,
    },
  },
);
