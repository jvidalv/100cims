import { differenceInCalendarDays, formatDistanceToNowStrict } from "date-fns";
import { format } from "date-fns/format";

import { getDateFnsLocale, getLocale } from "@/lib/locale";

/**
 * Serialize a calendar date (e.g. a summit ascent date) as a plain
 * `YYYY-MM-DD` string using the Date's *local* fields — the day the user
 * actually picked.
 *
 * NEVER use `date.toISOString()` for calendar dates: it converts local
 * midnight to a UTC instant, shifting the day for users east of UTC.
 */
export const toLocalDateString = (date: Date): string =>
  format(date, "yyyy-MM-dd");

/**
 * Parse a calendar date string into a `Date` at *local* midnight, so a date
 * picker reads back the same day the value represents.
 *
 * Accepts a plain `YYYY-MM-DD` string (preferred) or a legacy ISO instant —
 * for the latter we take the date part before the `T` so an old
 * `toISOString()`-shaped value (still cached or in flight) doesn't shift.
 */
export const parseLocalDateString = (value: string): Date => {
  const [datePart = ""] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
};

export const formatDayDistance = (date: Date) => {
  const locale = getLocale();
  const dateFnsLocale = getDateFnsLocale();
  const days = differenceInCalendarDays(date, new Date());

  if (days === 0) {
    if (locale === "ca") return "avui";
    if (locale === "es") return "hoy";
    return "today";
  }

  if (days === 1) {
    if (locale === "ca") return "demà";
    if (locale === "es") return "mañana";
    return "tomorrow";
  }

  if (days === -1) {
    if (locale === "ca") return "ahir";
    if (locale === "es") return "ayer";
    return "yesterday";
  }

  return formatDistanceToNowStrict(date, {
    unit: "day",
    roundingMethod: "floor",
    locale: dateFnsLocale,
    addSuffix: true,
  });
};
