import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { uuidv7 } from "uuidv7";

import { db } from "@/db";
import { mountainTable, summitHasUsersTable, summitTable } from "@/db/schema";
import { formatDateForPostgresFromISOString } from "@/api/lib/dates";
import { isBase64SizeValid } from "@/api/lib/images";
import { IMAGE_TO_BIG } from "@/api/routes/@shared/error-codes";
import { getPublicUrl, putImageOnS3 } from "@/api/routes/@shared/s3";
import { ErrorFieldResponse } from "@/api/schemas/common.schema";

export const mountainSummitPostRoute = new Elysia().post(
  "/summit",
  async ({ body, set }) => {
    const id = uuidv7();

    let imageUrl: string;
    if (body.image) {
      if (!isBase64SizeValid(body.image, 2048)) {
        set.status = 500;
        return { error: IMAGE_TO_BIG };
      }
      const key = `${process.env.APP_NAME}/mountain/summit/${id}.jpeg`;
      await putImageOnS3(key, Buffer.from(body.image, "base64"));
      imageUrl = getPublicUrl(key);
    } else {
      const [mountain] = await db
        .select({ imageUrl: mountainTable.imageUrl })
        .from(mountainTable)
        .where(eq(mountainTable.id, body.mountainId))
        .limit(1);
      if (!mountain?.imageUrl) {
        set.status = 500;
        return { error: "No mountain image available" };
      }
      imageUrl = mountain.imageUrl;
    }

    await db.transaction(async (tx) => {
      const [summit] = await tx
        .insert(summitTable)
        .values({
          id,
          mountainId: body.mountainId,
          userId: body.usersId[0],
          imageUrl,
          summitedAt: formatDateForPostgresFromISOString(body.date),
        })
        .returning();

      await tx.insert(summitHasUsersTable).values(
        body.usersId.map((userId) => ({
          summitId: summit.id,
          userId,
        })),
      );
    });

    return {
      success: true,
      summitId: id,
    };
  },
  {
    body: t.Object({
      mountainId: t.String(),
      usersId: t.Array(t.String()),
      date: t.String(),
      image: t.Optional(t.String()),
    }),
    response: {
      200: t.Object({
        success: t.Boolean(),
        summitId: t.String(),
      }),
      500: ErrorFieldResponse,
    },
  },
);
