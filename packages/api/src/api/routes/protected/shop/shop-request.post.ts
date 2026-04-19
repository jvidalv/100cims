import { eq } from "drizzle-orm";
import { Elysia } from "elysia";

import { sendPushLocalized } from "@/api/lib/push";
import { getUserFromRequest } from "@/api/routes/@shared/auth";
import {
  ShopRequestCreateBodySchema,
  ShopRequestCreateResponseSchema,
} from "@/api/schemas/shop.schema";
import { db } from "@/db";
import { shopRequestTable, userTable } from "@/db/schema";

const MERCH_ALERT_EMAIL = "ainegar555@gmail.com";

const buildPushMessage = (senderEmail: string, message: string) => {
  const preview = message.slice(0, 80).replace(/\s+/g, " ").trim();
  return (locale: string | null) => {
    const code = locale?.slice(0, 2).toLowerCase();
    if (code === "ca") {
      return {
        title: "Nova comanda de merch",
        body: `De ${senderEmail}: ${preview}`,
      };
    }
    if (code === "es") {
      return {
        title: "Nuevo pedido de merch",
        body: `De ${senderEmail}: ${preview}`,
      };
    }
    return {
      title: "New merch request",
      body: `From ${senderEmail}: ${preview}`,
    };
  };
};

export const shopRequestPostRoute = new Elysia().post(
  "/request",
  async ({ request, body }) => {
    const user = getUserFromRequest(request);

    const [inserted] = await db
      .insert(shopRequestTable)
      .values({
        userId: user.id,
        userEmail: user.email,
        message: body.message,
      })
      .returning({ id: shopRequestTable.id });

    try {
      const [recipient] = await db
        .select({ id: userTable.id })
        .from(userTable)
        .where(eq(userTable.email, MERCH_ALERT_EMAIL))
        .limit(1);

      if (recipient) {
        await sendPushLocalized(
          [recipient.id],
          buildPushMessage(user.email, body.message),
          { type: "shop_request", id: inserted.id },
        );
      } else {
        console.warn(
          `[shop-request] alert recipient not found: ${MERCH_ALERT_EMAIL}`,
        );
      }
    } catch (err) {
      console.warn("[shop-request] push skipped/failed", err);
    }

    return { success: true, id: inserted.id };
  },
  {
    body: ShopRequestCreateBodySchema,
    response: ShopRequestCreateResponseSchema,
  },
);
