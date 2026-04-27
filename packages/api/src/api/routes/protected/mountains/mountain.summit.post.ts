import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { uuidv7 } from "uuidv7";

import { db } from "@/db";
import {
  mountainRatingTable,
  mountainTable,
  summitHasUsersTable,
  summitTable,
} from "@/db/schema";
import {
  clampDateStringToTodayUtc,
  formatDateForPostgresFromISOString,
} from "@/api/lib/dates";
import { isBase64SizeValid, reportImageTooBig } from "@/api/lib/images";
import { recalcMountainRatingAggregates } from "@/api/lib/mountain-ratings";
import { sendPushLocalized } from "@/api/lib/push";
import {
  pushSummitTaggedBody,
  pushSummitTaggedTitle,
} from "@/api/lib/push-translations";
import { PUSH_TYPE, getUserDisplayName } from "@/api/lib/push-types";
import { getUserFromRequest } from "@/api/routes/@shared/auth";
import { IMAGE_TO_BIG } from "@/api/routes/@shared/error-codes";
import { getPublicUrl, putImageOnS3 } from "@/api/routes/@shared/s3";
import { unlockIcon } from "@/api/routes/@shared/unlockables";
import { ErrorFieldResponse } from "@/api/schemas/common.schema";

export const mountainSummitPostRoute = new Elysia().post(
  "/summit",
  async ({ body, request, set }) => {
    const actor = getUserFromRequest(request);
    const id = uuidv7();

    const [mountain] = await db
      .select({
        name: mountainTable.name,
        slug: mountainTable.slug,
        imageUrl: mountainTable.imageUrl,
      })
      .from(mountainTable)
      .where(eq(mountainTable.id, body.mountainId))
      .limit(1);

    let imageUrl: string;
    if (body.image) {
      if (!isBase64SizeValid(body.image)) {
        reportImageTooBig(request, {
          route: "mountains/summit",
          base64Data: body.image,
          userId: actor.id,
        });
        set.status = 500;
        return { error: IMAGE_TO_BIG };
      }
      const key = `${process.env.APP_NAME}/mountain/summit/${id}.jpeg`;
      await putImageOnS3(key, Buffer.from(body.image, "base64"));
      imageUrl = getPublicUrl(key);
    } else {
      if (!mountain?.imageUrl) {
        set.status = 500;
        return { error: "No mountain image available" };
      }
      imageUrl = mountain.imageUrl;
    }

    const familyFriendly = body.familyFriendly ?? null;
    const dogFriendly = body.dogFriendly ?? null;
    const difficulty = body.difficulty ?? null;
    const hasRating =
      familyFriendly !== null || dogFriendly !== null || difficulty !== null;

    await db.transaction(async (tx) => {
      const [summit] = await tx
        .insert(summitTable)
        .values({
          id,
          mountainId: body.mountainId,
          userId: body.usersId[0],
          imageUrl,
          summitedAt: clampDateStringToTodayUtc(
            formatDateForPostgresFromISOString(body.date),
          ),
        })
        .returning();

      await tx.insert(summitHasUsersTable).values(
        body.usersId.map((userId) => ({
          summitId: summit.id,
          userId,
        })),
      );

      if (hasRating) {
        await tx
          .insert(mountainRatingTable)
          .values({
            mountainId: body.mountainId,
            userId: actor.id,
            familyFriendly,
            dogFriendly,
            difficulty,
          })
          .onConflictDoUpdate({
            target: [
              mountainRatingTable.mountainId,
              mountainRatingTable.userId,
            ],
            set: {
              familyFriendly,
              dogFriendly,
              difficulty,
              updatedAt: new Date(),
            },
          });
        await recalcMountainRatingAggregates(body.mountainId, tx);
      }
    });

    if (mountain?.slug) {
      const unlockKey: "forcat" | "picat" | null =
        mountain.slug === "pollego-superior-pedraforca" ||
        mountain.slug === "pollego-inferior-pedraforca"
          ? "forcat"
          : mountain.slug === "pica-destats"
            ? "picat"
            : null;
      if (unlockKey) {
        for (const userId of body.usersId) {
          void unlockIcon(userId, unlockKey).catch((err) =>
            console.error("unlockIcon failed", { userId, unlockKey, err }),
          );
        }
      }
    }

    const recipients = body.usersId.filter((userId) => userId !== actor.id);
    if (recipients.length > 0 && mountain?.name) {
      const actorName = getUserDisplayName(actor);
      const mountainName = mountain.name;
      void sendPushLocalized(
        recipients,
        (locale) => ({
          title: pushSummitTaggedTitle(locale, mountainName),
          body: pushSummitTaggedBody(locale, actorName),
        }),
        { type: PUSH_TYPE.SUMMIT_TAGGED, summitId: id },
      );
    }

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
      familyFriendly: t.Optional(
        t.Nullable(t.Integer({ minimum: 1, maximum: 5 })),
      ),
      dogFriendly: t.Optional(
        t.Nullable(t.Integer({ minimum: 1, maximum: 5 })),
      ),
      difficulty: t.Optional(t.Nullable(t.Integer({ minimum: 1, maximum: 5 }))),
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
