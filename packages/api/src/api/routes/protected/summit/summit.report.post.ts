import { and, count, eq, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";

import {
  DISCORD_COLOR,
  DISCORD_CONTACT_WEBHOOK_URL,
  sendDiscordEmbed,
} from "@/api/lib/discord";
import { getUserFromRequest } from "@/api/routes/@shared/auth";
import { db } from "@/db";
import {
  mountainTable,
  summitHasUsersTable,
  summitPhotoReportTable,
  summitTable,
} from "@/db/schema";
import { SITE_URL } from "@/lib/app-links";

const REPORT_THRESHOLD = 2;

export const summitReportPostRoute = new Elysia().post(
  "/report",
  async ({ body, request, set }) => {
    const { summitId } = body;
    const reporter = getUserFromRequest(request);
    const reporterId = reporter.id;

    const [summit] = await db
      .select({
        id: summitTable.id,
        ownerId: summitTable.userId,
        imageUrl: summitTable.imageUrl,
        photoVersion: summitTable.photoVersion,
        mountainId: summitTable.mountainId,
        mountainImageUrl: mountainTable.imageUrl,
      })
      .from(summitTable)
      .leftJoin(mountainTable, eq(summitTable.mountainId, mountainTable.id))
      .where(eq(summitTable.id, summitId))
      .limit(1);

    if (!summit) {
      set.status = 404;
      return { success: false, autoReverted: false };
    }

    if (summit.ownerId === reporterId) {
      set.status = 403;
      return { success: false, autoReverted: false };
    }

    const [participant] = await db
      .select({ id: summitHasUsersTable.id })
      .from(summitHasUsersTable)
      .where(
        and(
          eq(summitHasUsersTable.summitId, summitId),
          eq(summitHasUsersTable.userId, reporterId),
        ),
      )
      .limit(1);

    if (participant) {
      set.status = 403;
      return { success: false, autoReverted: false };
    }

    await db
      .insert(summitPhotoReportTable)
      .values({
        summitId,
        reporterId,
        photoVersion: summit.photoVersion,
      })
      .onConflictDoNothing();

    const [countRow] = await db
      .select({ count: count() })
      .from(summitPhotoReportTable)
      .where(
        and(
          eq(summitPhotoReportTable.summitId, summitId),
          eq(summitPhotoReportTable.photoVersion, summit.photoVersion),
        ),
      );
    const reportsAtVersion = countRow?.count ?? 0;

    const atThreshold = reportsAtVersion >= REPORT_THRESHOLD;
    const shouldRevert = atThreshold && !!summit.mountainImageUrl;

    if (shouldRevert) {
      await db
        .update(summitTable)
        .set({
          imageUrl: summit.mountainImageUrl ?? summit.imageUrl,
          photoVersion: sql`${summitTable.photoVersion} + 1`,
        })
        .where(eq(summitTable.id, summitId));
    }

    const color = atThreshold ? DISCORD_COLOR.RED : DISCORD_COLOR.YELLOW;
    const title = shouldRevert
      ? "🧹 Summit photo auto-reverted"
      : atThreshold
        ? "⚠️ Summit photo reports at threshold (no mountain image to revert to)"
        : "📨 Summit photo reported";

    sendDiscordEmbed(DISCORD_CONTACT_WEBHOOK_URL, {
      title,
      color,
      image: { url: summit.imageUrl },
      fields: [
        {
          name: "Summit",
          value: `${SITE_URL}/admin/summits/${summitId}`,
        },
        {
          name: "Reporter",
          value: `${reporterId} (${reporter.email})`,
          inline: true,
        },
        {
          name: "Owner",
          value: summit.ownerId ?? "(none)",
          inline: true,
        },
        {
          name: "Photo URL",
          value: summit.imageUrl,
        },
        {
          name: "Reports at this version",
          value: `${reportsAtVersion} / ${REPORT_THRESHOLD}`,
          inline: true,
        },
      ],
    });

    return { success: true, autoReverted: shouldRevert };
  },
  {
    body: t.Object({
      summitId: t.String(),
    }),
    response: t.Object({
      success: t.Boolean(),
      autoReverted: t.Boolean(),
    }),
  },
);
