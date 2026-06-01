import { eq } from "drizzle-orm";
import { Elysia } from "elysia";

import { db } from "@/db";
import { userTable } from "@/db/schema";
import { getAdminUserId } from "@/api/routes/admin/admin-context";
import { SuccessResponse } from "@/api/schemas/common.schema";
import { MeSchema } from "@/api/schemas/user.schema";

export const adminMeGetRoute = new Elysia().get(
  "/me",
  async ({ request }) => {
    const [user] = await db
      .select({
        id: userTable.id,
        email: userTable.email,
        firstName: userTable.firstName,
        lastName: userTable.lastName,
        imageUrl: userTable.imageUrl,
        town: userTable.town,
        phoneNumber: userTable.phoneNumber,
        shippingStreet: userTable.shippingStreet,
        shippingCity: userTable.shippingCity,
        shippingPostalCode: userTable.shippingPostalCode,
        shippingCountry: userTable.shippingCountry,
        visibleOnHiscores: userTable.visibleOnHiscores,
        visibleOnPeopleSearch: userTable.visibleOnPeopleSearch,
        admin: userTable.admin,
        locale: userTable.locale,
        username: userTable.username,
        activeChallengeId: userTable.activeChallengeId,
        unlockables: userTable.unlockables,
        createdAt: userTable.createdAt,
      })
      .from(userTable)
      .where(eq(userTable.id, getAdminUserId(request)));
    return { success: true, message: user };
  },
  { response: SuccessResponse(MeSchema) },
);
