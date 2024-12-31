import { desc, eq, and } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { uuidv7 } from "uuidv7";

import { db } from "@/api/db";
import {
  mountainTable,
  summitHasUsersTable,
  summitTable,
  userTable,
} from "@/api/db/schema";
import { formatDateForPostgres } from "@/api/lib/dates";
import { isBase64SizeValid } from "@/api/lib/images";
import { IMAGE_TO_BIG } from "@/api/routes/@shared/error-codes";
import { JWT } from "@/api/routes/@shared/jwt";
import { getPublicUrl, putImageOnS3 } from "@/api/routes/@shared/s3";

export const mountainRoute = new Elysia({ prefix: "/mountain" })
  .use(JWT())
  .get(
    "/summits",
    async ({ query }) => {
      const mountainId =
        query.mountainId === "undefined" ? undefined : query.mountainId;

      const results = await db
        .select({
          summitId: summitTable.id,
          summitedAt: summitTable.summitedAt,
          createdAt: summitTable.createdAt,
          mountainId: summitTable.mountainId,
          mountainName: mountainTable.name,
          userId: userTable.id,
          userFirstName: userTable.firstName,
          userLastName: userTable.lastName,
          userImageUrl: userTable.imageUrl,
        })
        .from(summitTable)
        .innerJoin(mountainTable, eq(summitTable.mountainId, mountainTable.id))
        .innerJoin(
          summitHasUsersTable,
          eq(summitTable.id, summitHasUsersTable.summitId),
        )
        .leftJoin(userTable, eq(summitHasUsersTable.userId, userTable.id))
        .where(
          and(
            eq(summitTable.validated, true),
            mountainId ? eq(summitTable.mountainId, mountainId) : undefined,
          ),
        )
        .orderBy(desc(summitTable.createdAt))
        .limit(!query.limit || query.limit > 50 ? 50 : query.limit)
        .execute();

      const groupedResults = results.reduce(
        (acc, row) => {
          const existingSummit = acc.find((s) => s.summitId === row.summitId);
          const user = {
            id: row.userId!,
            firstName: row.userFirstName,
            lastName: row.userLastName,
            imageUrl: row.userImageUrl,
          };

          if (existingSummit) {
            existingSummit.users.push(user);
          } else {
            acc.push({
              summitId: row.summitId,
              mountainId: row.mountainId!,
              summitedAt: row.summitedAt,
              createdAt: row.createdAt,
              mountainName: row.mountainName,
              users: [user],
            });
          }
          return acc;
        },
        [] as {
          summitId: string;
          mountainId: string;
          summitedAt: string;
          createdAt: Date;
          mountainName: string;
          users: {
            id: string;
            firstName: string | null;
            lastName: string | null;
            imageUrl: string | null;
          }[];
        }[],
      );

      return {
        success: true,
        message: groupedResults,
      };
    },
    {
      response: t.Object({
        success: t.Boolean(),
        message: t.Array(
          t.Object({
            summitId: t.String(),
            summitedAt: t.String(),
            createdAt: t.Date(),
            mountainId: t.String(),
            mountainName: t.String(),
            users: t.Array(
              t.Object({
                id: t.String(),
                firstName: t.Nullable(t.String()), // Nullable if the user may not have a first name
                lastName: t.Nullable(t.String()), // Nullable if the user may not have a last name
                imageUrl: t.Nullable(t.String()), // Nullable if the user may not have an image
              }),
            ),
          }),
        ),
      }),
      query: t.Object({
        mountainId: t.Optional(t.String()),
        limit: t.Optional(t.Number()),
      }),
    },
  )
  .post(
    "/summit",
    async ({ body, error }) => {
      const id = uuidv7();
      const key = `${process.env.APP_NAME}/mountain/summit/${id}.jpeg`;

      if (!isBase64SizeValid(body.image, 200)) {
        return error(500, { success: false, message: IMAGE_TO_BIG });
      }

      const content = Buffer.from(body.image, "base64");
      await putImageOnS3(key, content);

      const rows = await db
        .insert(summitTable)
        .values({
          id,
          mountainId: body.mountainId,
          imageUrl: getPublicUrl(key),
          summitedAt: formatDateForPostgres(new Date(body.date)),
        })
        .returning();

      const summit = rows[0];

      if (summit) {
        await db.insert(summitHasUsersTable).values(
          body.usersId.map((id) => ({
            summitId: summit.id,
            userId: id,
          })),
        );
      }

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
        500: t.Object({
          success: t.Boolean(),
          message: t.String(),
        }),
        200: t.Object({
          success: t.Boolean(),
        }),
      },
    },
  );
