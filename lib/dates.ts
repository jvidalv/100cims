import { differenceInCalendarDays, formatDistanceToNowStrict } from "date-fns";

import { getDateFnsLocale, getLocale } from "@/lib/locale";

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
