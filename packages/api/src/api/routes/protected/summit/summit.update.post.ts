import { and, eq, ne, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { isBase64SizeValid, reportImageTooBig } from "@/api/lib/images";
import { getUserFromRequest } from "@/api/routes/@shared/auth";
import { IMAGE_TO_BIG } from "@/api/routes/@shared/error-codes";
import { getPublicUrl, putImageOnS3 } from "@/api/routes/@shared/s3";
import { db } from "@/db";
import { summitHasUsersTable, summitTable } from "@/db/schema";

export const summitUpdatePostRoute = new Elysia().post(
  "/update",
  async ({ body, request, set }) => {
    const { summitId, summitedAt, image, usersId } = body;

    const userId = getUserFromRequest(request).id;

    const summitUserRecord = await db
      .select()
      .from(summitHasUsersTable)
      .where(
        and(
          eq(summitHasUsersTable.summitId, summitId),
          eq(summitHasUsersTable.userId, userId),
        ),
      );

    if (!summitUserRecord.length) {
      return {
        success: false,
        message: "Summit record not found or unauthorized",
      };
    }

    const updates: { summitedAt?: string; imageUrl?: string } = {};
    if (summitedAt) updates.summitedAt = summitedAt;

    if (image) {
      if (!isBase64SizeValid(image)) {
        reportImageTooBig(request, {
          route: "summit/update",
          base64Data: image,
          userId,
        });
        set.status = 500;
        return { success: false, message: IMAGE_TO_BIG };
      }
      const key = `${process.env.APP_NAME}/mountain/summit/${summitId}-${Date.now()}.jpeg`;
      await putImageOnS3(key, Buffer.from(image, "base64"));
      updates.imageUrl = getPublicUrl(key);
    }

    await db.transaction(async (tx) => {
      if (Object.keys(updates).length > 0) {
        await tx
          .update(summitTable)
          .set({
            ...updates,
            ...(updates.imageUrl !== undefined
              ? { photoVersion: sql`${summitTable.photoVersion} + 1` }
              : {}),
          })
          .where(eq(summitTable.id, summitId));
      }

      if (usersId) {
        await tx
          .delete(summitHasUsersTable)
          .where(
            and(
              eq(summitHasUsersTable.summitId, summitId),
              ne(summitHasUsersTable.userId, userId),
            ),
          );
        const toInsert = usersId.filter((id) => id !== userId);
        if (toInsert.length > 0) {
          await tx
            .insert(summitHasUsersTable)
            .values(toInsert.map((id) => ({ summitId, userId: id })))
            .onConflictDoNothing();
        }
      }
    });

    return { success: true, message: "Summit updated successfully" };
  },
  {
    body: t.Object({
      summitId: t.String(),
      summitedAt: t.Optional(t.String()),
      image: t.Optional(t.String()),
      usersId: t.Optional(t.Array(t.String())),
    }),
    response: t.Object({
      success: t.Boolean(),
      message: t.String(),
    }),
  },
);
