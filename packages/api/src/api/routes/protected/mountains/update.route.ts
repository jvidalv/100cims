import { eq } from "drizzle-orm";
import { Elysia } from "elysia";

import { db } from "@/db";
import { mountainTable } from "@/db/schema";
import { isBase64SizeValid } from "@/api/lib/images";
import { IMAGE_TO_BIG } from "@/api/routes/@shared/error-codes";
import { JWT } from "@/api/routes/@shared/jwt";
import { getPublicUrl, putImageOnS3 } from "@/api/routes/@shared/s3";
import { getStoreUser } from "@/api/routes/@shared/store";
import {
  SuccessResponse,
  ErrorFieldResponse,
} from "@/api/schemas/common.schema";
import {
  UpdateMountainBody,
  CreatedMountainSchema,
} from "@/api/schemas/mountain.schema";

export const updateMountainRoute = new Elysia().use(JWT()).post(
  "/update",
  async ({ body, store, set }) => {
    const user = getStoreUser(store);

    // Validate image size early (before any DB operations)
    if (body.image && !isBase64SizeValid(body.image, 2048)) {
      set.status = 400;
      return { error: IMAGE_TO_BIG };
    }

    // Check if mountain exists and user is authorized
    const existing = await db
      .select({
        id: mountainTable.id,
        creatorId: mountainTable.creatorId,
      })
      .from(mountainTable)
      .where(eq(mountainTable.id, body.id))
      .limit(1);

    if (!existing.length) {
      set.status = 404;
      return { error: "Mountain not found" };
    }

    if (existing[0].creatorId !== user.id) {
      set.status = 403;
      return { error: "Not authorized to update this mountain" };
    }

    // Handle image upload after authorization check
    let imageUrl: string | undefined;
    if (body.image) {
      const key = `${process.env.APP_NAME}/mountain/profile/${body.id}.jpeg`;
      const content = Buffer.from(body.image, "base64");
      await putImageOnS3(key, content);
      imageUrl = getPublicUrl(key);
    }

    // Build update object with only defined fields
    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.height !== undefined) updateData.height = body.height.toString();
    if (body.latitude !== undefined)
      updateData.latitude = body.latitude.toString();
    if (body.longitude !== undefined)
      updateData.longitude = body.longitude.toString();
    if (body.essential !== undefined) updateData.essential = body.essential;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;

    const [updated] = await db
      .update(mountainTable)
      .set(updateData)
      .where(eq(mountainTable.id, body.id))
      .returning();

    if (!updated) {
      set.status = 404;
      return { error: "Mountain not found" };
    }

    return {
      success: true,
      message: {
        id: updated.id,
        name: updated.name,
        slug: updated.slug,
        location: updated.location,
        height: updated.height,
        latitude: updated.latitude,
        longitude: updated.longitude,
        imageUrl: updated.imageUrl,
        essential: updated.essential,
        creatorId: updated.creatorId,
      },
    };
  },
  {
    body: UpdateMountainBody,
    response: {
      200: SuccessResponse(CreatedMountainSchema),
      400: ErrorFieldResponse,
      403: ErrorFieldResponse,
      404: ErrorFieldResponse,
    },
  },
);
