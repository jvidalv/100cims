import { desc, eq, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { donorTable, userTable } from "@/db/schema";
import { JWT } from "@/api/routes/@shared/jwt";
import { getStoreUser } from "@/api/routes/@shared/store";
import { SuccessResponse } from "@/api/schemas/common.schema";
import { DonorsArraySchema } from "@/api/schemas/donor.schema";

export const donorRoute = new Elysia({ prefix: "/donors" })
  .use(JWT())
  .get(
    "/all",
    async () => {
      const results = await db
        .select({
          userId: userTable.id,
          userImageUrl: userTable.imageUrl,
          userFirstName: userTable.firstName,
          userLastName: userTable.lastName,
          totalDonation: sql<string>`SUM(${donorTable.donation})`.as(
            "totalDonation",
          ),
        })
        .from(donorTable)
        .innerJoin(userTable, eq(donorTable.userId, userTable.id))
        .groupBy(
          userTable.id,
          userTable.imageUrl,
          userTable.firstName,
          userTable.lastName,
        )
        .orderBy(desc(sql`SUM(${donorTable.donation})`));

      return {
        success: true,
        message: results,
      };
    },
    {
      response: SuccessResponse(DonorsArraySchema),
    },
  )
  .get(
    "/current-month",
    async () => {
      const startOfMonth = sql`date_trunc('month', CURRENT_DATE)`;
      const totalDonation = await db
        .select({
          total: sql<string>`COALESCE(SUM(${donorTable.donation}), 0)`.as(
            "total",
          ),
        })
        .from(donorTable)
        .where(sql`${donorTable.createdAt} >= ${startOfMonth}`)
        .then((res) => res[0]?.total || "0");

      return {
        success: true,
        message: { totalDonation },
      };
    },
    {
      response: t.Object({
        success: t.Boolean(),
        message: t.Object({
          totalDonation: t.String(),
        }),
      }),
    },
  )
  .post(
    "/",
    async ({ store, body, set }) => {
      const user = getStoreUser(store);

      if (!body.quantity) {
        set.status = 400;
        return { success: false };
      }

      const quantity = Number.parseFloat(body.quantity);

      if (quantity <= 0) {
        set.status = 400;
        return { success: false };
      }

      await db.insert(donorTable).values({
        userId: user.id,
        donation: body.quantity,
      });

      return {
        success: true,
      };
    },
    {
      body: t.Object({
        quantity: t.String(),
      }),
      response: {
        400: t.Object({
          success: t.Boolean(),
        }),
        200: t.Object({
          success: t.Boolean(),
        }),
      },
    },
  );
