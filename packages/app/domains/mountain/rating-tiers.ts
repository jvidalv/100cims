import type { IntlShape } from "react-intl";

import { tierColor } from "@/components/ui/atoms/themed-tier-picker";
import { makeTupleGuard } from "@/lib/type-guards";

export type SafetyTierKey = "unsafe" | "mixed" | "safe";
export type SafetyTierPosition = 0 | 1 | 2;
export type SafetyTier = {
  key: SafetyTierKey;
  label: string;
  position: SafetyTierPosition;
};

export const safetyTier = (avg: number, intl: IntlShape): SafetyTier => {
  if (avg >= 4) {
    return {
      key: "safe",
      label: intl.formatMessage({ defaultMessage: "Safe" }),
      position: 2,
    };
  }
  if (avg <= 2) {
    return {
      key: "unsafe",
      label: intl.formatMessage({ defaultMessage: "Unsafe" }),
      position: 0,
    };
  }
  return {
    key: "mixed",
    label: intl.formatMessage({ defaultMessage: "Mixed" }),
    position: 1,
  };
};

export const DIFFICULTY_TIER_KEYS = [
  "easy",
  "moderate",
  "hard",
  "very-hard",
] as const;
export type DifficultyTierKey = (typeof DIFFICULTY_TIER_KEYS)[number];
export const isDifficultyTierKey = makeTupleGuard(DIFFICULTY_TIER_KEYS);
export type DifficultyTierPosition = 0 | 2 | 3 | 4;
export type DifficultyTier = {
  key: DifficultyTierKey;
  label: string;
  position: DifficultyTierPosition;
};

// Aggregates on the mountain detail page use a 4-tier scale; the rating input
// stays 3-tier since an individual voter can't meaningfully distinguish
// "hard" from "very hard". Cutoffs at 1.5 / 3.5 / 4.5 mean each non-center
// tier requires ≥75% crowd agreement — unanimous Hard (avg = 5) reads as
// Very Hard and anything more mixed honestly degrades. An exact avg of 1.5
// stays Easy: it takes a clear lean above the boundary to read as Moderate.
export const difficultyTier = (avg: number, intl: IntlShape): DifficultyTier => {
  if (avg >= 4.5) {
    return {
      key: "very-hard",
      label: intl.formatMessage({ defaultMessage: "Very Hard" }),
      position: 4,
    };
  }
  if (avg >= 3.5) {
    return {
      key: "hard",
      label: intl.formatMessage({ defaultMessage: "Hard" }),
      position: 3,
    };
  }
  if (avg > 1.5) {
    return {
      key: "moderate",
      label: intl.formatMessage({ defaultMessage: "Moderate" }),
      position: 2,
    };
  }
  return {
    key: "easy",
    label: intl.formatMessage({ defaultMessage: "Easy" }),
    position: 0,
  };
};

export type RatingAxis = "difficulty" | "family" | "dog";

/**
 * Resolve a rating average to its display label + gradient color. Difficulty
 * runs on the 5-tier scale reversed (hard = red); family/dog on the 3-tier
 * safety scale. Single source of truth for the count/reverse args to
 * `tierColor` — both the Ratings section and the rating-detail dialog use it.
 */
export const resolveRatingTier = (
  axis: RatingAxis,
  avg: number,
  intl: IntlShape,
): { label: string; color: string } => {
  if (axis === "difficulty") {
    const tier = difficultyTier(avg, intl);
    return { label: tier.label, color: tierColor(tier.position, 5, true) };
  }
  const tier = safetyTier(avg, intl);
  return { label: tier.label, color: tierColor(tier.position, 3) };
};
