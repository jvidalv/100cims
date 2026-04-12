import { and, eq, inArray, isNotNull } from "drizzle-orm";

import { db } from "@/db";
import { userTable } from "@/db/schema";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const BATCH_SIZE = 100;

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default";
}

interface ExpoPushTicket {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string };
}

interface ExpoPushResponse {
  data?: ExpoPushTicket[];
}

export type LocalizedPushBuilder = (locale: string | null) => {
  title: string;
  body: string;
};

interface Addressed {
  userId: string;
  message: ExpoPushMessage;
}

const postBatch = async (batch: Addressed[]) => {
  const accessToken = process.env.EXPO_ACCESS_TOKEN;
  const response = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    },
    body: JSON.stringify(batch.map((b) => b.message)),
  });

  if (!response.ok) {
    console.error("[push] Expo returned", response.status);
    return;
  }

  const result: ExpoPushResponse = await response.json();
  const tickets = result.data ?? [];

  const deadUserIds: string[] = [];
  tickets.forEach((ticket, idx) => {
    if (
      ticket.status === "error" &&
      ticket.details?.error === "DeviceNotRegistered"
    ) {
      const userId = batch[idx]?.userId;
      if (userId) deadUserIds.push(userId);
    }
  });

  if (deadUserIds.length) {
    await db
      .update(userTable)
      .set({ expoPushToken: null })
      .where(inArray(userTable.id, deadUserIds));
  }
};

export const sendPushLocalized = async (
  userIds: string[],
  build: LocalizedPushBuilder,
  data?: Record<string, unknown>,
) => {
  if (!userIds.length) return;

  try {
    const recipients = await db
      .select({
        id: userTable.id,
        token: userTable.expoPushToken,
        locale: userTable.locale,
      })
      .from(userTable)
      .where(
        and(
          inArray(userTable.id, userIds),
          eq(userTable.pushNotificationsEnabled, true),
          isNotNull(userTable.expoPushToken),
        ),
      );

    const addressed: Addressed[] = [];
    for (const r of recipients) {
      if (!r.token) continue;
      const { title, body } = build(r.locale);
      addressed.push({
        userId: r.id,
        message: { to: r.token, title, body, data, sound: "default" },
      });
    }

    if (!addressed.length) return;

    const batches: Addressed[][] = [];
    for (let i = 0; i < addressed.length; i += BATCH_SIZE) {
      batches.push(addressed.slice(i, i + BATCH_SIZE));
    }

    await Promise.allSettled(batches.map(postBatch));
  } catch (err) {
    console.error("[push] send failed:", err);
  }
};
