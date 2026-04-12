import { desc, eq, sql } from "drizzle-orm";
import { Elysia } from "elysia";

import { db } from "@/db";
import { donorTable, userTable } from "@/db/schema";
import { SuccessResponse } from "@/api/schemas/common.schema";
import { DonorsArraySchema } from "@/api/schemas/donor.schema";

export const donorAllGetRoute = new Elysia().get(
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
);
