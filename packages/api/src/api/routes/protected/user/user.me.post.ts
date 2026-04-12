import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { userTable } from "@/db/schema";
import { isBase64SizeValid } from "@/api/lib/images";
import {
  IMAGE_TO_BIG,
  IMAGE_UPLOAD_FAILED,
} from "@/api/routes/@shared/error-codes";
import { getPublicUrl, putImageOnS3 } from "@/api/routes/@shared/s3";
import { getUserFromRequest } from "@/api/routes/@shared/auth";
import {
  SimpleSuccessResponse,
  ErrorFieldResponse,
} from "@/api/schemas/common.schema";

export const userMePostRoute = new Elysia().post(
  "/me",
  async ({ body, request, set }) => {
    const user = getUserFromRequest(request);
    const key = `${process.env.APP_NAME}/user/avatar/${user.id}.jpeg`;

    let imageUrl: string | undefined;
    const imageBase64 = body.image || body.imageUrl;
    if (imageBase64) {
      if (!isBase64SizeValid(imageBase64, 2048)) {
        set.status = 500;
        return { error: IMAGE_TO_BIG };
      }
      const content = Buffer.from(imageBase64, "base64");
      try {
        await putImageOnS3(key, content);
        imageUrl = getPublicUrl(key);
      } catch {
        set.status = 500;
        return { error: IMAGE_UPLOAD_FAILED };
      }
    }

    await db
      .update(userTable)
      .set({
        firstName: body.firstName,
        lastName: body.lastName,
        imageUrl,
        visibleOnHiscores: body.visibleOnHiscores,
        visibleOnPeopleSearch: body.visibleOnPeopleSearch,
        town: body.town,
        activeChallengeId: body.activeChallengeId,
      })
      .where(eq(userTable.id, user.id));

    return {
      success: true,
    };
  },
  {
    body: t.Object({
      firstName: t.Optional(t.String()),
      lastName: t.Optional(t.String()),
      image: t.Optional(t.String()),
      imageUrl: t.Optional(t.String()),
      town: t.Optional(t.String()),
      visibleOnHiscores: t.Optional(t.Boolean()),
      visibleOnPeopleSearch: t.Optional(t.Boolean()),
      activeChallengeId: t.Optional(t.String()),
    }),
    response: {
      200: SimpleSuccessResponse,
      500: ErrorFieldResponse,
    },
  },
);
