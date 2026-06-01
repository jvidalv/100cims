/**
 * Normalize an incoming summit-ascent date into a Postgres `YYYY-MM-DD` string.
 *
 * Accepts either:
 *  - a plain `YYYY-MM-DD` calendar-date string (what current app builds send) —
 *    returned verbatim, no timezone math; or
 *  - a legacy ISO instant (`...T..:..:..Z`) from older app versions still in
 *    the wild — the literal date part before the `T` is used as-is.
 *
 * The literal date part is always trusted when present, so this stays
 * backwards-compatible with old clients (which send local-midnight-as-UTC and
 * are therefore slightly off for users east of UTC — accepted tradeoff; fixed
 * client-side in newer builds).
 */
export function formatDateForPostgresFromISOString(isoString: string): string {
  try {
    const [datePart] = isoString.split("T");

    if (datePart && datePart.includes("-")) {
      const [year, month, day] = datePart.split("-");
      if (year && month && day) {
        return `${year}-${month}-${day}`;
      }
    }

    // Fallback for exotic/malformed inputs without a `-`-delimited date part.
    // Use UTC getters so the result never depends on the server's timezone.
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      throw new Error("Invalid date");
    }

    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  } catch {
    throw new Error("Invalid ISO date string");
  }
}

function utcDateString(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Clamp a YYYY-MM-DD date string so it can never be a genuinely future date.
//
// We compare against *tomorrow* in UTC, not today. The summit date is a local
// calendar date: a user's real "today" can be up to one day ahead of UTC today
// (someone at UTC+14 just after local midnight). Comparing against today-UTC
// would wrongly clamp those valid late-night picks back a day — re-introducing
// the very off-by-one this fix removes. Tomorrow-UTC tolerates that one-day
// timezone skew while still catching dates that are actually in the future
// (e.g. older buggy app builds that let users pick days ahead).
export function clampDateStringToTodayUtc(date: string): string {
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const upperBound = utcDateString(tomorrow);
  return date > upperBound ? upperBound : date;
}
