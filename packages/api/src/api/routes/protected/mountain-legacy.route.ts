/**
 * LEGACY ROUTE - DO NOT MODIFY
 * This route exists for backwards compatibility with old mobile app versions.
 * Old path: POST /api/protected/mountain/summit
 * New path: POST /api/protected/mountains/summit
 *
 * This file can be removed once all users have updated to app versions
 * that use the new /mountains/summit endpoint.
 */
import { Elysia, t } from "elysia";
import { uuidv7 } from "uuidv7";

import { db } from "@/db";
import { summitHasUsersTable, summitTable } from "@/db/schema";
import { formatDateForPostgresFromISOString } from "@/api/lib/dates";
import { isBase64SizeValid } from "@/api/lib/images";
import { IMAGE_TO_BIG } from "@/api/routes/@shared/error-codes";
import { JWT } from "@/api/routes/@shared/jwt";
import { getPublicUrl, putImageOnS3 } from "@/api/routes/@shared/s3";
import {
  SimpleSuccessResponse,
  ErrorFieldResponse,
} from "@/api/schemas/common.schema";

export const mountainLegacyRoute = new Elysia({ prefix: "/mountain" })
  .use(JWT())
  .post(
    "/summit",
    async ({ body, set }) => {
      const id = uuidv7();
      const key = `${process.env.APP_NAME}/mountain/summit/${id}.jpeg`;

      if (!isBase64SizeValid(body.image, 2048)) {
        set.status = 500;
        return { error: IMAGE_TO_BIG };
      }

      const content = Buffer.from(body.image, "base64");
      await putImageOnS3(key, content);

      await db.transaction(async (tx) => {
        const [summit] = await tx
          .insert(summitTable)
          .values({
            id,
            mountainId: body.mountainId,
            userId: body.usersId[0],
            imageUrl: getPublicUrl(key),
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
      };
    },
    {
      body: t.Object({
        mountainId: t.String(),
        usersId: t.Array(t.String()),
        date: t.String(),
        image: t.String(),
      }),
      response: {
        200: SimpleSuccessResponse,
        500: ErrorFieldResponse,
      },
    }
  );
