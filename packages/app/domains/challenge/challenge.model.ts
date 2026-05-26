/**
 * Single source of truth for "percent of mountains summited in a challenge".
 * `floor` (not `round`) so the list and the detail page always agree, and so
 * 99/100 reads as 99% rather than rounding up to 100% and lying about
 * completion. Empty challenges return null — callers decide whether to show
 * 0% or hide the badge.
 */
export const challengeCompletionPercent = (
  summited: number,
  total: number,
): number | null => {
  if (total <= 0) return null;
  return Math.floor((summited / total) * 100);
};

export const countryToEmoji = (country: string) => {
  if (country === "ESP") {
    return "🇪🇸";
  }

  if (country === "FRA") {
    return "🇫🇷";
  }

  if (country === "USA") {
    return "🇺🇸";
  }

  return "🌍";
};
