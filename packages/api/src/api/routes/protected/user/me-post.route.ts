import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { userTable } from "@/db/schema";
import { isBase64SizeValid } from "@/api/lib/images";
import { IMAGE_TO_BIG } from "@/api/routes/@shared/error-codes";
import { JWT } from "@/api/routes/@shared/jwt";
import { getPublicUrl, putImageOnS3 } from "@/api/routes/@shared/s3";
import { getStoreUser } from "@/api/routes/@shared/store";
import {
  SimpleSuccessResponse,
  ErrorFieldResponse,
} from "@/api/schemas/common.schema";

export const mePostRoute = new Elysia().use(JWT()).post(
  "/me",
  async ({ body, store, set }) => {
    const user = getStoreUser(store);
    const key = `${process.env.APP_NAME}/user/avatar/${user.id}.jpeg`;

    let image;
    const imageBase64 = body.image || body.imageUrl;
    if (imageBase64) {
      if (!isBase64SizeValid(imageBase64, 2048)) {
        set.status = 500;
        return { error: IMAGE_TO_BIG };
      }
      const content = Buffer.from(imageBase64, "base64");
      try {
        image = await putImageOnS3(key, content);
      } catch (err) {
        console.log(err);
      }
    }

    console.log(3, body.image, image);

    await db
      .update(userTable)
      .set({
        firstName: body.firstName,
        lastName: body.lastName,
        imageUrl: image ? getPublicUrl(key) : undefined,
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
