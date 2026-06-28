import { and, eq, gte, inArray, isNotNull, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  challengeHasMountainTable,
  mountainTable,
  summitHasUsersTable,
  summitTable,
  userTable,
} from "@/db/schema";
import { sendPushLocalized } from "@/api/lib/push";
import {
  pushMountainSuggestionBody,
  pushMountainSuggestionTitle,
} from "@/api/lib/push-translations";
import { PUSH_TYPE } from "@/api/lib/push-types";

interface Coords {
  lat: number;
  lng: number;
}

const haversineKm = (a: Coords, b: Coords) => {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};

interface Candidate {
  id: string;
  slug: string;
  name: string;
  lat: number;
  lng: number;
}

const RANDOM_POOL_SIZE = 10;

const pickNearby = (origin: Coords, candidates: Candidate[]) => {
  if (!candidates.length) return null;
  const ranked = candidates
    .map((c) => ({ c, km: haversineKm(origin, { lat: c.lat, lng: c.lng }) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, RANDOM_POOL_SIZE);
  const choice = ranked[Math.floor(Math.random() * ranked.length)];
  return { mountain: choice.c, km: choice.km };
};

export async function recommendWeeklyMountain(): Promise<void> {
  const users = await db
    .select({
      id: userTable.id,
      locale: userTable.locale,
      lat: userTable.lastLatitude,
      lng: userTable.lastLongitude,
      activeChallengeId: userTable.activeChallengeId,
    })
    .from(userTable)
    .where(
      and(
        eq(userTable.pushNotificationsEnabled, true),
        isNotNull(userTable.expoPushToken),
        isNotNull(userTable.lastLatitude),
        isNotNull(userTable.lastLongitude),
        isNotNull(userTable.activeChallengeId),
        gte(userTable.lastLocationAt, sql`NOW() - INTERVAL '30 days'`),
      ),
    );

  if (!users.length) {
    console.log("[recommend-weekly-mountain] no eligible users");
    return;
  }

  const challengeIds = Array.from(
    new Set(
      users
        .map((u) => u.activeChallengeId)
        .filter((id): id is string => id !== null),
    ),
  );

  const rows = await db
    .select({
      challengeId: challengeHasMountainTable.challengeId,
      mountainId: mountainTable.id,
      slug: mountainTable.slug,
      name: mountainTable.name,
      lat: mountainTable.latitude,
      lng: mountainTable.longitude,
    })
    .from(challengeHasMountainTable)
    .innerJoin(
      mountainTable,
      eq(challengeHasMountainTable.mountainId, mountainTable.id),
    )
    .where(inArray(challengeHasMountainTable.challengeId, challengeIds));

  const mountainsByChallenge = new Map<string, Candidate[]>();
  for (const r of rows) {
    if (!r.challengeId) continue;
    const list = mountainsByChallenge.get(r.challengeId) ?? [];
    list.push({
      id: r.mountainId,
      slug: r.slug,
      name: r.name,
      lat: Number(r.lat),
      lng: Number(r.lng),
    });
    mountainsByChallenge.set(r.challengeId, list);
  }

  // A user's summits live on the `summit_has_users` join table, NOT on
  // `summit.user_id` (that column is legacy/creator-only and is populated for
  // just a fraction of rows). Counting via `summit.user_id` undercounts badly
  // — it's what made the progress read "10 of 523" when the user had really
  // summited ~30. Join through `summit_has_users` like hiscores does, and
  // count only validated summits so `done` matches the leaderboard.
  const userIds = users.map((u) => u.id);
  const summits = await db
    .select({
      userId: summitHasUsersTable.userId,
      mountainId: summitTable.mountainId,
    })
    .from(summitHasUsersTable)
    .innerJoin(summitTable, eq(summitHasUsersTable.summitId, summitTable.id))
    .where(
      and(
        inArray(summitHasUsersTable.userId, userIds),
        eq(summitTable.validated, true),
      ),
    );

  const summitedByUser = new Map<string, Set<string>>();
  for (const s of summits) {
    if (!s.userId || !s.mountainId) continue;
    let set = summitedByUser.get(s.userId);
    if (!set) {
      set = new Set();
      summitedByUser.set(s.userId, set);
    }
    set.add(s.mountainId);
  }

  let sent = 0;
  let skippedNoPool = 0;
  let skippedComplete = 0;

  for (const user of users) {
    if (
      user.lat === null ||
      user.lng === null ||
      user.activeChallengeId === null
    )
      continue;

    const challengeMountains = mountainsByChallenge.get(user.activeChallengeId);
    if (!challengeMountains || !challengeMountains.length) {
      skippedNoPool += 1;
      continue;
    }

    const summited = summitedByUser.get(user.id) ?? new Set<string>();
    const remaining = challengeMountains.filter((m) => !summited.has(m.id));

    if (!remaining.length) {
      skippedComplete += 1;
      continue;
    }

    const origin: Coords = { lat: Number(user.lat), lng: Number(user.lng) };
    const pick = pickNearby(origin, remaining);
    if (!pick) continue;

    const total = challengeMountains.length;
    const done = total - remaining.length;
    const km = Math.max(1, Math.round(pick.km));

    await sendPushLocalized(
      [user.id],
      (locale) => ({
        title: pushMountainSuggestionTitle(locale, km),
        body: pushMountainSuggestionBody(locale, pick.mountain.name, {
          done,
          total,
        }),
      }),
      {
        type: PUSH_TYPE.MOUNTAIN_SUGGESTION,
        mountainSlug: pick.mountain.slug,
      },
    );
    sent += 1;
  }

  console.log(
    `[recommend-weekly-mountain] sent ${sent} push(es) | skipped: ${skippedNoPool} (challenge empty), ${skippedComplete} (challenge complete) | eligible users: ${users.length}`,
  );
}
