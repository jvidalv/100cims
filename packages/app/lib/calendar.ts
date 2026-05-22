import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";

import { Dimensions } from "react-native";

import { getDateFnsLocale } from "@/lib/locale";

export type CalendarMonthData = {
  key: string;
  label: string;
  weeks: (Date | null)[][];
};

/**
 * Every month renders the same WEEKS_PER_MONTH rows (the max a month can span)
 * so all month blocks have identical height — that keeps the calendar's
 * FlatList `getItemLayout` exact and the screen free of mount-time scroll drift.
 */
export const WEEKS_PER_MONTH = 6;

// Layout constants — the single source of truth shared by CalendarMonth's
// explicit height and the screen's getItemLayout. Keep them in sync with the
// classNames in calendar-month.tsx.
const HORIZONTAL_PADDING = 24; // px-6 on each side
const MONTH_HEADER_HEIGHT = 28; // text-lg label row
const WEEKDAY_ROW_HEIGHT = 18; // text-xs weekday-label row
const MONTH_BOTTOM_PADDING = 24; // pb-6

/** Height of one week row: 7 aspect-square cells across the padded width. */
export const WEEK_ROW_HEIGHT =
  (Dimensions.get("window").width - HORIZONTAL_PADDING * 2) / 7;

/** Fixed pixel height of a CalendarMonth block — identical for every month. */
export const CALENDAR_MONTH_HEIGHT =
  MONTH_HEADER_HEIGHT +
  WEEKDAY_ROW_HEIGHT +
  WEEKS_PER_MONTH * WEEK_ROW_HEIGHT +
  MONTH_BOTTOM_PADDING;

const weekStartsOn = (): 0 | 1 | 2 | 3 | 4 | 5 | 6 =>
  getDateFnsLocale().options?.weekStartsOn ?? 0;

/**
 * Build a single month as a grid of weeks. Each week is a length-7 array;
 * cells outside the month are `null` so the grid stays aligned regardless of
 * which weekday the month starts on. The grid is always WEEKS_PER_MONTH rows.
 */
export const buildCalendarMonth = (date: Date): CalendarMonthData => {
  const locale = getDateFnsLocale();
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  const days = eachDayOfInterval({ start, end });

  // Distance from the locale's first weekday to the month's first day.
  const offset = (getDay(start) - weekStartsOn() + 7) % 7;

  const cells: (Date | null)[] = [
    ...(Array.from({ length: offset }) as null[]).fill(null),
    ...days,
  ];
  while (cells.length < WEEKS_PER_MONTH * 7) cells.push(null);

  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return {
    key: format(start, "yyyy-MM"),
    label: format(start, "LLLL yyyy", { locale }),
    weeks,
  };
};

/**
 * A fixed window of months centred on the current month, oldest first.
 * The current month's index in the result is always `monthsBack`.
 */
export const buildCalendarRange = (
  monthsBack = 12,
  monthsForward = 12,
): CalendarMonthData[] => {
  const today = new Date();
  const total = monthsBack + monthsForward + 1;
  return Array.from({ length: total }, (_, i) =>
    buildCalendarMonth(addMonths(subMonths(today, monthsBack), i)),
  );
};

/** Short weekday labels ordered by the active locale's first weekday. */
export const getWeekdayLabels = (): string[] => {
  const locale = getDateFnsLocale();
  const firstDay = startOfWeek(new Date(), { weekStartsOn: weekStartsOn() });
  return Array.from({ length: 7 }, (_, i) =>
    format(addDays(firstDay, i), "EEEEEE", { locale }),
  );
};
