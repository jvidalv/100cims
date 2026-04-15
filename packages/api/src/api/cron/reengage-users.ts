import { and, count, eq, gte, isNotNull, lt, max, sql } from "drizzle-orm";

import { db } from "@/db";
import { emailLogTable, summitTable, userTable } from "@/db/schema";
import {
  DISCORD_COLOR,
  DISCORD_ERRORS_WEBHOOK_URL,
  sendDiscordEmbed,
} from "@/api/lib/discord";
import {
  EMAIL_SLUGS,
  sendReengageColdEmail,
  sendReengageSummerEmail,
} from "@/api/lib/email";
import { mapWithConcurrency } from "@/api/cron/lib/concurrent";

const MAX_PER_COHORT_PER_RUN = 50;

type Candidate = {
  id: string;
  email: string;
  firstName: string | null;
  locale: string | null;
};

// Subquery: per-user summit count + most-recent summit timestamp.
// summitTable.userId is the "main user" FK — co-summiteers via summit_has_users
// don't count here, which is the desired behavior for re-engagement (the email
// asks them to log THEIR OWN summits, not friends').
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

const recentlyEmailed = sql`EXISTS (
  SELECT 1 FROM ${emailLogTable}
  WHERE ${emailLogTable.userId} = ${userTable.id}
    AND ${emailLogTable.slug} IN ('reengage_cold', 'reengage_summer')
    AND ${emailLogTable.sentAt} > NOW() - INTERVAL '60 days'
)`;

const fetchCohortA = async (): Promise<Candidate[]> => {
  // Cold: 0 or 1 own summits, signed up >30 days ago.
  const rows = await db
    .select({
      id: userTable.id,
      email: userTable.email,
      firstName: userTable.firstName,
      locale: userTable.locale,
    })
    .from(userTable)
    .leftJoin(summitsByUser, eq(summitsByUser.userId, userTable.id))
    .where(
      and(
        eq(userTable.emailNotificationsEnabled, true),
        lt(userTable.createdAt, sql`NOW() - INTERVAL '30 days'`),
        sql`COALESCE(${summitsByUser.count}, 0) <= 1`,
        sql`NOT ${recentlyEmailed}`,
      ),
    )
    .orderBy(userTable.createdAt)
    .limit(MAX_PER_COHORT_PER_RUN);
  return rows;
};

const fetchCohortB = async (): Promise<Candidate[]> => {
  // Lapsed: 2+ own summits, most recent >90 days ago.
  const rows = await db
    .select({
      id: userTable.id,
      email: userTable.email,
      firstName: userTable.firstName,
      locale: userTable.locale,
    })
    .from(userTable)
    .innerJoin(summitsByUser, eq(summitsByUser.userId, userTable.id))
    .where(
      and(
        eq(userTable.emailNotificationsEnabled, true),
        gte(summitsByUser.count, 2),
        lt(summitsByUser.lastAt, sql`NOW() - INTERVAL '90 days'`),
        sql`NOT ${recentlyEmailed}`,
      ),
    )
    .orderBy(userTable.createdAt)
    .limit(MAX_PER_COHORT_PER_RUN);
  return rows;
};

const sendBatch = async (
  candidates: Candidate[],
  slug: string,
  send: (u: Candidate) => Promise<boolean>,
): Promise<{ sent: number; failed: number }> => {
  let sent = 0;
  let failed = 0;
  await mapWithConcurrency(candidates, 10, async (user) => {
    const ok = await send(user);
    if (ok) {
      sent++;
      try {
        await db.insert(emailLogTable).values({ userId: user.id, slug });
      } catch (e) {
        // Log-insert failure is non-fatal; user might double-receive next week.
        console.error("[reengage-users] email_log insert failed", {
          userId: user.id,
          slug,
          e,
        });
      }
    } else {
      failed++;
    }
  });
  return { sent, failed };
};

export const reengageUsers = async () => {
  const cohortA = await fetchCohortA();
  const cohortB = await fetchCohortB();

  const a = await sendBatch(cohortA, EMAIL_SLUGS.reengageCold, (u) =>
    sendReengageColdEmail({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      locale: u.locale,
    }),
  );
  const b = await sendBatch(cohortB, EMAIL_SLUGS.reengageSummer, (u) =>
    sendReengageSummerEmail({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      locale: u.locale,
    }),
  );

  const total = a.sent + b.sent;
  const totalFailed = a.failed + b.failed;
  console.log(
    `[reengage-users] cold: ${a.sent}/${cohortA.length}; summer: ${b.sent}/${cohortB.length}; failed: ${totalFailed}`,
  );

  if (total > 0 || totalFailed > 0) {
    sendDiscordEmbed(DISCORD_ERRORS_WEBHOOK_URL, {
      title: "Re-engagement run",
      color: totalFailed > 0 ? DISCORD_COLOR.RED : DISCORD_COLOR.BLURPLE,
      fields: [
        {
          name: "Cold (sent / batch)",
          value: `${a.sent} / ${cohortA.length}`,
          inline: true,
        },
        {
          name: "Summer (sent / batch)",
          value: `${b.sent} / ${cohortB.length}`,
          inline: true,
        },
        { name: "Failed", value: String(totalFailed), inline: true },
      ],
    });
  }
};
