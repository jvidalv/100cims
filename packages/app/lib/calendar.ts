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

import { getDateFnsLocale } from "@/lib/locale";

export type CalendarCell = {
  date: Date;
  /** False for trailing days of the previous month or leading days of the next. */
  inMonth: boolean;
};

export type CalendarMonthData = {
  key: string;
  label: string;
  weeks: CalendarCell[][];
};

/**
 * Every month renders the same WEEKS_PER_MONTH rows (the max a month can span).
 * Short months still fill the page because week rows flex inside CalendarMonth.
 */
export const WEEKS_PER_MONTH = 6;

const weekStartsOn = (): 0 | 1 | 2 | 3 | 4 | 5 | 6 =>
  getDateFnsLocale().options?.weekStartsOn ?? 0;

/**
 * Build a single month as a grid of weeks. Each week is a length-7 array;
 * cells outside the month show the adjacent month's date (rendered dimmed in
 * the UI) so the grid never has empty cells, matching iOS's calendar.
 */
export const buildCalendarMonth = (date: Date): CalendarMonthData => {
  const locale = getDateFnsLocale();
  const start = startOfMonth(date);
  const end = endOfMonth(date);

  // Distance from the locale's first weekday to the month's first day.
  const leading = (getDay(start) - weekStartsOn() + 7) % 7;
  const total = WEEKS_PER_MONTH * 7;

  const gridStart = addDays(start, -leading);
  const gridEnd = addDays(gridStart, total - 1);
  const allDates = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const cells: CalendarCell[] = allDates.map((d) => ({
    date: d,
    inMonth: d >= start && d <= end,
  }));

  const weeks: CalendarCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return {
    key: format(start, "yyyy-MM"),
    label: format(start, "LLLL", { locale }),
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
