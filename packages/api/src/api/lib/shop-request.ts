import { eq } from "drizzle-orm";

import { sendPushLocalized } from "@/api/lib/push";
import {
  pushShopRequestBody,
  pushShopRequestTitle,
} from "@/api/lib/push-translations";
import { PUSH_TYPE } from "@/api/lib/push-types";
import { db } from "@/db";
import { shopRequestTable, userTable } from "@/db/schema";

export const MERCH_ALERT_EMAIL = "ainegar555@gmail.com";
export const MERCH_MESSAGE_PREFIX = "[MERCH ORDER]";

interface CreateArgs {
  userId: string;
  userEmail: string;
  message: string;
}

const toPreview = (message: string) =>
  message.slice(0, 80).replace(/\s+/g, " ").trim();

const fireMerchAlert = async (
  senderEmail: string,
  message: string,
  id: string,
) => {
  const [recipient] = await db
    .select({ id: userTable.id })
    .from(userTable)
    .where(eq(userTable.email, MERCH_ALERT_EMAIL))
    .limit(1);
  if (!recipient) {
    console.warn(
      `[shop-request] alert recipient not found: ${MERCH_ALERT_EMAIL}`,
    );
    return;
  }
  const preview = toPreview(message);
  await sendPushLocalized(
    [recipient.id],
    (locale) => ({
      title: pushShopRequestTitle(locale),
      body: pushShopRequestBody(locale, senderEmail, preview),
    }),
    { type: PUSH_TYPE.SHOP_REQUEST, id },
  );
};

export const createShopRequest = async ({
  userId,
  userEmail,
  message,
}: CreateArgs): Promise<{ id: string }> => {
  const [inserted] = await db
    .insert(shopRequestTable)
    .values({ userId, userEmail, message })
    .returning({ id: shopRequestTable.id });

  void fireMerchAlert(userEmail, message, inserted.id).catch((err) => {
    console.warn("[shop-request] push skipped/failed", err);
  });

  return { id: inserted.id };
};
