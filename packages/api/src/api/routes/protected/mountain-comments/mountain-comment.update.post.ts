import { and, eq } from "drizzle-orm";
import { Elysia } from "elysia";

import { db } from "@/db";
import { mountainCommentTable } from "@/db/schema";
import {
  CommentImageError,
  resolveCommentImage,
} from "@/api/lib/comment-images";
import { reportImageTooBig } from "@/api/lib/images";
import { getUserFromRequest } from "@/api/routes/@shared/auth";
import { IMAGE_TO_BIG } from "@/api/routes/@shared/error-codes";
import {
  ErrorFieldResponse,
  SimpleSuccessResponse,
} from "@/api/schemas/common.schema";
import { UpdateMountainCommentBody } from "@/api/schemas/mountain-comment.schema";

export const mountainCommentUpdatePostRoute = new Elysia().post(
  "/update",
  async ({ body, request, set }) => {
    const viewer = getUserFromRequest(request);

    // Resolve the image array up-front so a size failure doesn't leave the
    // body half-updated. Existing items come back as `{url}` unchanged;
    // base64 items get uploaded to S3 keyed by the comment id. Removed
    // items are simply absent from the incoming array — their S3 objects
    // become orphans (intentional per product call).
    let nextImages: { url: string }[] | undefined;
    if (body.images) {
      try {
        nextImages = await Promise.all(
          body.images.map((item) => resolveCommentImage(item, body.id)),
        );
      } catch (e) {
        if (e instanceof CommentImageError && e.status === 400) {
          const offending = body.images.find(
            (item) => !item.startsWith("http") && item.length > 0,
          );
          if (offending) {
            reportImageTooBig(request, {
              route: "mountain-comments/update",
              base64Data: offending,
              userId: viewer.id,
            });
          }
          set.status = 500;
          return { error: IMAGE_TO_BIG };
        }
        set.status = 500;
        return { error: "Image upload failed" };
      }
    }

    // Ownership: only the author can update their own comment. Admin uses
    // the admin-side update endpoint.
    const [updated] = await db
      .update(mountainCommentTable)
      .set({
        body: body.body,
        ...(nextImages !== undefined ? { images: nextImages } : {}),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(mountainCommentTable.id, body.id),
          eq(mountainCommentTable.userId, viewer.id),
        ),
      )
      .returning({ id: mountainCommentTable.id });

    if (!updated) {
      set.status = 404;
      return { error: "Comment not found" };
    }
    return { success: true };
  },
  {
    body: UpdateMountainCommentBody,
    response: {
      200: SimpleSuccessResponse,
      404: ErrorFieldResponse,
    },
  },
);
