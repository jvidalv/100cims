import { and, asc, desc, eq, or, sql, inArray } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import {
  challengeHasMountainTable,
  mountainTable,
  summitHasUsersTable,
  summitTable,
  userTable,
} from "@/db/schema";
import { isBase64SizeValid } from "@/api/lib/images";
import { addRowToSheets, SUGGESTIONS_SPREADSHEET } from "@/api/lib/sheets";
import { IMAGE_TO_BIG } from "@/api/routes/@shared/error-codes";
import { JWT } from "@/api/routes/@shared/jwt";
import { getPublicUrl, putImageOnS3 } from "@/api/routes/@shared/s3";
import { getStoreUser } from "@/api/routes/@shared/store";
import {
  SuccessResponse,
  SimpleSuccessResponse,
  ErrorFieldResponse,
} from "@/api/schemas/common.schema";
import {
  UserSchema,
  BasicUsersArraySchema,
  UserSummitsResponseSchema,
} from "@/api/schemas/user.schema";

export const userRoute = new Elysia({ prefix: "/user" })
  .use(JWT())
  .get(
    "/me",
    async ({ store }) => {
      return {
        success: true,
        message: getStoreUser(store),
      };
    },
    {
      response: SuccessResponse(UserSchema),
    },
  )
  .post(
    "/me",
    async ({ body, store, set }) => {
      const user = getStoreUser(store);
      const key = `${process.env.APP_NAME}/user/avatar/${user.id}.jpeg`;

      let image;
      if (body.image) {
        if (!isBase64SizeValid(body.image, 2048)) {
          set.status = 500;
          return { error: IMAGE_TO_BIG };
        }
        const content = Buffer.from(body.image, "base64");
        image = await putImageOnS3(key, content);
      }

      await db
        .update(userTable)
        .set({
          firstName: body.firstName,
          lastName: body.lastName,
          imageUrl: image ? getPublicUrl(key) : undefined,
          visibleOnHiscores: body.visibleOnHiscores,
          visibleOnPeopleSearch: body.visibleOnPeopleSearch,
          town: body.town,
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
        town: t.Optional(t.String()),
        visibleOnHiscores: t.Optional(t.Boolean()),
        visibleOnPeopleSearch: t.Optional(t.Boolean()),
      }),
      response: {
        200: SimpleSuccessResponse,
        500: ErrorFieldResponse,
      },
    },
  )
  .get(
    "/summits",
    async ({ store, query }) => {
      const user = getStoreUser(store);
      const userId = user.id;

      const results = await db
        .select({
          summitId: summitTable.id,
          summitedAt: summitTable.summitedAt,
          summitedValidated: summitTable.validated,
          mountainName: mountainTable.name,
          mountainSlug: mountainTable.slug,
          mountainImageUrl: mountainTable.imageUrl,
          mountainHeight: mountainTable.height,
          mountainEssential: mountainTable.essential,
        })
        .from(summitHasUsersTable)
        .innerJoin(
          summitTable,
          eq(summitHasUsersTable.summitId, summitTable.id),
        )
        .innerJoin(mountainTable, eq(summitTable.mountainId, mountainTable.id))
        .leftJoin(
          challengeHasMountainTable,
          eq(mountainTable.id, challengeHasMountainTable.mountainId),
        )
        .where(
          and(
            eq(summitHasUsersTable.userId, userId),
            query.challengeId
              ? eq(challengeHasMountainTable.challengeId, query.challengeId)
              : undefined,
          ),
        )
        .groupBy(
          summitTable.id,
          summitTable.summitedAt,
          summitTable.validated,
          mountainTable.name,
          mountainTable.slug,
          mountainTable.imageUrl,
          mountainTable.height,
          mountainTable.essential,
        )
        .orderBy(desc(summitTable.summitedAt), desc(summitTable.createdAt));

      const summitsWithScore = results.map((props) => {
        return {
          ...props,
          score:
            (parseInt(props.mountainHeight) / 10) *
            (props.mountainEssential ? 2 : 1),
        };
      });

      const uniquePeaks = new Set(
        summitsWithScore.map((summit) => summit.mountainSlug),
      );

      const essentialPeaks = new Set(
        summitsWithScore
          .filter((summit) => summit.mountainEssential)
          .map((summit) => summit.mountainSlug),
      );

      return {
        success: true,
        message: {
          score: summitsWithScore.reduce((acc, current) => {
            if (!current.summitedValidated) {
              return acc;
            }

            acc = acc + current.score;
            return acc;
          }, 0),
          uniquePeaksCount: uniquePeaks.size,
          essentialPeaksCount: essentialPeaks.size,
          summits: summitsWithScore,
        },
      };
    },
    {
      query: t.Optional(
        t.Object({
          challengeId: t.Optional(t.String()),
        }),
      ),
      response: SuccessResponse(UserSummitsResponseSchema),
    },
  )
  .get(
    "/all",
    async ({ store, query }) => {
      const user = getStoreUser(store);
      const q = query.q;

      let users = [
        {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          imageUrl: user.imageUrl,
        },
      ];

      if (q) {
        users = await db
          .select({
            id: userTable.id,
            firstName: userTable.firstName,
            lastName: userTable.lastName,
            imageUrl: userTable.imageUrl,
          })
          .from(userTable)
          .where(
            and(
              or(
                eq(userTable.visibleOnPeopleSearch, true),
                eq(userTable.id, user.id),
              ),
              or(
                sql`unaccent(${userTable.firstName}) ILIKE unaccent(${`%${q}%`})`,
                sql`unaccent(${userTable.lastName}) ILIKE unaccent(${`%${q}%`})`,
              ),
            ),
          )
          .orderBy(asc(userTable.firstName));
      }

      return {
        success: true,
        message: users,
      };
    },
    {
      query: t.Object({
        q: t.String(),
      }),
      response: SuccessResponse(BasicUsersArraySchema),
    },
  )
  .get(
    "/delete",
    async ({ store, set }) => {
      const user = getStoreUser(store);

      const deletedUser = await db
        .delete(userTable)
        .where(eq(userTable.id, user.id))
        .returning();

      if (!deletedUser) {
        set.status = 500;
        return { error: true };
      }

      // Query to find all `summitTable` entries without corresponding `summitHasUsersTable` entries
      const orphanedSummits = await db
        .select({ id: summitTable.id })
        .from(summitTable)
        .leftJoin(
          summitHasUsersTable,
          eq(summitTable.id, summitHasUsersTable.summitId),
        )
        .where(sql`${summitHasUsersTable.id} IS NULL`);

      const orphanedSummitIds = orphanedSummits.map((summit) => summit.id);
      if (orphanedSummitIds.length > 0) {
        await db
          .delete(summitTable)
          .where(inArray(summitTable.id, orphanedSummitIds));
      }

      return {
        success: true,
      };
    },
    {
      response: {
        200: SimpleSuccessResponse,
        500: ErrorFieldResponse,
      },
    },
  )
  .post(
    "/suggestion",
    async ({ body, store }) => {
      const user = getStoreUser(store);
      await addRowToSheets(SUGGESTIONS_SPREADSHEET, [
        user.email,
        body.suggestion,
      ]);
      return {
        success: true,
      };
    },
    {
      body: t.Object({
        suggestion: t.String(),
      }),
      response: SimpleSuccessResponse,
    },
  );
