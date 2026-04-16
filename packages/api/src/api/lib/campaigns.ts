import { and, count, eq, isNotNull, max, sql, type SQL } from "drizzle-orm";

import { mapWithConcurrency } from "@/api/cron/lib/concurrent";
import {
  sendReengageColdEmail,
  sendReengageSummerEmail,
} from "@/api/lib/email";
import { db } from "@/db";
import { emailLogTable, summitTable, userTable } from "@/db/schema";

// summitTable.userId is the main-user FK; co-summiteers via summit_has_users
// don't count — campaigns target the user's own logging behavior.
const summitsByUser = db
  .select({
    userId: summitTable.userId,
    count: count().as("c"),
    lastAt: max(summitTable.summitedAt).as("last_at"),
  })
  .from(summitTable)
  .where(isNotNull(summitTable.userId))
  .groupBy(summitTable.userId)
  .as("s");

type Audience = {
  description: string;
  predicate: SQL;
};

const coldAudience: Audience = {
  description: "0–1 own summits, signed up >30 days ago",
  predicate: sql`${userTable.createdAt} < NOW() - INTERVAL '30 days'
    AND COALESCE(${summitsByUser.count}, 0) <= 1`,
};

const summerAudience: Audience = {
  description: "2+ own summits, last summit >90 days ago",
  predicate: sql`${summitsByUser.count} >= 2
    AND ${summitsByUser.lastAt} < NOW() - INTERVAL '90 days'`,
};

type Candidate = {
  id: string;
  email: string;
  firstName: string | null;
  locale: string | null;
};

export type CampaignSlug = "reengage_cold" | "reengage_summer";

type Campaign = {
  slug: CampaignSlug;
  audience: Audience;
  send: (user: Candidate) => Promise<boolean>;
};

const CAMPAIGNS: Record<CampaignSlug, Campaign> = {
  reengage_cold: {
    slug: "reengage_cold",
    audience: coldAudience,
    send: sendReengageColdEmail,
  },
  reengage_summer: {
    slug: "reengage_summer",
    audience: summerAudience,
    send: sendReengageSummerEmail,
  },
};

const isCampaignSlug = (s: string): s is CampaignSlug =>
  Object.prototype.hasOwnProperty.call(CAMPAIGNS, s);

export const getCampaign = (slug: string): Campaign | null =>
  isCampaignSlug(slug) ? CAMPAIGNS[slug] : null;

export const campaignDescription = (slug: CampaignSlug): string =>
  CAMPAIGNS[slug].audience.description;

const eligibleFilter = (c: Campaign) =>
  and(
    eq(userTable.emailNotificationsEnabled, true),
    c.audience.predicate,
    sql`NOT EXISTS (
      SELECT 1 FROM ${emailLogTable}
      WHERE ${emailLogTable.userId} = ${userTable.id}
        AND ${emailLogTable.slug} = ${c.slug}
    )`,
  );

export const countReached = async (slug: CampaignSlug): Promise<number> => {
  const [row] = await db
    .select({ n: sql<number>`COUNT(DISTINCT ${emailLogTable.userId})::int` })
    .from(emailLogTable)
    .where(eq(emailLogTable.slug, slug));
  return row?.n ?? 0;
};

export const countEligible = async (c: Campaign): Promise<number> => {
  const [row] = await db
    .select({ n: count() })
    .from(userTable)
    .leftJoin(summitsByUser, eq(summitsByUser.userId, userTable.id))
    .where(eligibleFilter(c));
  return row?.n ?? 0;
};

const pickBatch = async (c: Campaign, limit: number): Promise<Candidate[]> => {
  return db
    .select({
      id: userTable.id,
      email: userTable.email,
      firstName: userTable.firstName,
      locale: userTable.locale,
    })
    .from(userTable)
    .leftJoin(summitsByUser, eq(summitsByUser.userId, userTable.id))
    .where(eligibleFilter(c))
    .orderBy(userTable.createdAt)
    .limit(limit);
};

export type CampaignRunResult = {
  attempted: number;
  sent: number;
  failed: number;
};

export const runCampaignBatch = async (
  c: Campaign,
  batchSize: number,
): Promise<CampaignRunResult> => {
  const candidates = await pickBatch(c, batchSize);

  const sentIds: string[] = [];
  let failed = 0;
  await mapWithConcurrency(candidates, 10, async (user) => {
    const ok = await c.send(user);
    if (ok) sentIds.push(user.id);
    else failed++;
  });

  if (sentIds.length > 0) {
    try {
      await db
        .insert(emailLogTable)
        .values(sentIds.map((userId) => ({ userId, slug: c.slug })));
    } catch (e) {
      // Bulk insert failure is non-fatal; users may appear eligible again.
      console.error("[campaigns] email_log bulk insert failed", {
        slug: c.slug,
        count: sentIds.length,
        e,
      });
    }
  }

  return {
    attempted: candidates.length,
    sent: sentIds.length,
    failed,
  };
};
