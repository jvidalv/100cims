import { and, count, countDistinct, eq, isNull, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  challengeHasMountainTable,
  challengeTable,
  mountainTable,
  summitTable,
} from "@/db/schema";

export interface OfficialChallengeRow {
  id: string;
  slug: string;
  name: string;
  country: string;
  emoji: string | null;
  imageUrl: string | null;
  description: string | null;
  mountainCount: number;
  summitCount: number;
}

export const getOfficialChallengeBySlug = async (
  slug: string,
): Promise<OfficialChallengeRow | null> => {
  const [row] = await db
    .select({
      id: challengeTable.id,
      slug: challengeTable.slug,
      name: challengeTable.name,
      country: challengeTable.country,
      emoji: challengeTable.emoji,
      imageUrl: challengeTable.imageUrl,
      description: challengeTable.description,
    })
    .from(challengeTable)
    .where(and(eq(challengeTable.slug, slug), isNull(challengeTable.creatorId)))
    .limit(1);

  if (!row) return null;

  const [[mountainAgg], [summitAgg]] = await Promise.all([
    db
      .select({ c: count() })
      .from(challengeHasMountainTable)
      .where(eq(challengeHasMountainTable.challengeId, row.id)),
    db
      .select({ c: countDistinct(summitTable.id) })
      .from(summitTable)
      .innerJoin(
        challengeHasMountainTable,
        eq(challengeHasMountainTable.mountainId, summitTable.mountainId),
      )
      .where(eq(challengeHasMountainTable.challengeId, row.id)),
  ]);

  return {
    ...row,
    mountainCount: mountainAgg?.c ?? 0,
    summitCount: summitAgg?.c ?? 0,
  };
};

export interface FeaturedPeak {
  id: string;
  slug: string;
  name: string;
  location: string;
  height: string;
  imageUrl: string | null;
}

export const getFeaturedPeaksForChallenge = async (
  challengeId: string,
  limit = 12,
): Promise<FeaturedPeak[]> =>
  db
    .select({
      id: mountainTable.id,
      slug: mountainTable.slug,
      name: mountainTable.name,
      location: mountainTable.location,
      height: mountainTable.height,
      imageUrl: mountainTable.imageUrl,
    })
    .from(mountainTable)
    .innerJoin(
      challengeHasMountainTable,
      eq(challengeHasMountainTable.mountainId, mountainTable.id),
    )
    .where(eq(challengeHasMountainTable.challengeId, challengeId))
    .orderBy(sql`random()`)
    .limit(limit);

export const getFeaturedPeaksForChallengeSlug = async (
  slug: string,
  limit = 12,
): Promise<FeaturedPeak[]> =>
  db
    .select({
      id: mountainTable.id,
      slug: mountainTable.slug,
      name: mountainTable.name,
      location: mountainTable.location,
      height: mountainTable.height,
      imageUrl: mountainTable.imageUrl,
    })
    .from(mountainTable)
    .innerJoin(
      challengeHasMountainTable,
      eq(challengeHasMountainTable.mountainId, mountainTable.id),
    )
    .innerJoin(
      challengeTable,
      eq(challengeHasMountainTable.challengeId, challengeTable.id),
    )
    .where(eq(challengeTable.slug, slug))
    .orderBy(sql`random()`)
    .limit(limit);
