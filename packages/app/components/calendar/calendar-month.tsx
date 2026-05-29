import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { memo, useMemo } from "react";
import { useIntl } from "react-intl";
import { TouchableOpacity, View } from "react-native";

import { LucideIcon, ThemedText } from "@/components/ui/atoms";
import { type CalendarEventType } from "@/domains/calendar/calendar.api";
import { type CalendarMonthData, getWeekdayLabels } from "@/lib/calendar";
import { toLocalDateString } from "@/lib/dates";

import { CalendarDay } from "./calendar-day";

type Props = {
  month: CalendarMonthData;
  height: number;
  selectedDateKey: string | null;
  eventTypesByDay: Record<string, CalendarEventType[]>;
  /** Set of date keys that contain at least one featured plan. Used by
   *  CalendarDay to draw a golden star alongside the per-event dots. */
  featuredDays: Set<string>;
  /** Direction the navigation pill should send the FlatList. At the last
   *  month in the range we flip to `prev` so the button is never a dead-end. */
  navDirection: "prev" | "next";
  /** Localized label of the month we jump to — the adjacent month's name. */
  navLabel: string;
  onDayPress: (date: Date) => void;
  onDayLongPress: (date: Date) => void;
  onNavigate: (direction: "prev" | "next") => void;
};

const EMPTY_EVENT_TYPES: CalendarEventType[] = [];

export const CalendarMonth = memo(
  ({
    month,
    height,
    selectedDateKey,
    eventTypesByDay,
    featuredDays,
    navDirection,
    navLabel,
    onDayPress,
    onDayLongPress,
    onNavigate,
  }: Props) => {
    const intl = useIntl();
    // Computed in-component (not at module scope) so it reads the locale only
    // after startup has resolved it — see lib/locale.ts initLocale.
    const weekdays = useMemo(() => getWeekdayLabels(), []);

    // key is `YYYY-MM`, so slicing is the simplest source for the year — no
    // need to walk into the weeks array (which can start in the prior month).
    const year = month.key.slice(0, 4);

    const navAccessibilityLabel =
      navDirection === "next"
        ? intl.formatMessage({ defaultMessage: "Next month" })
        : intl.formatMessage({ defaultMessage: "Previous month" });

    return (
      <View className="pb-2" style={{ height }}>
        <View className="h-16 flex-row items-center justify-between px-6">
          <ThemedText className="text-4xl font-bold capitalize">
            {month.label}{" "}
            <ThemedText className="text-4xl font-bold text-muted-foreground/50">
              {year}
            </ThemedText>
          </ThemedText>
          <TouchableOpacity
            onPress={() => onNavigate(navDirection)}
            hitSlop={8}
            accessibilityLabel={navAccessibilityLabel}
            className="flex-row items-center gap-0.5 opacity-50"
          >
            <ThemedText className="text-sm font-medium capitalize text-muted-foreground">
              {navLabel}
            </ThemedText>
            <LucideIcon
              icon={navDirection === "next" ? ChevronRight : ChevronLeft}
              size={16}
              muted
            />
          </TouchableOpacity>
        </View>
        <View className="h-[18px] flex-row border-b border-border">
          {weekdays.map((label, i) => (
            <ThemedText
              key={i}
              className="flex-1 text-center text-xs capitalize text-muted-foreground"
            >
              {label}
            </ThemedText>
          ))}
        </View>
        {month.weeks.map((week, weekIndex) => (
          <View
            key={weekIndex}
            className={
              weekIndex < month.weeks.length - 1
                ? "flex-1 flex-row border-b border-border"
                : "flex-1 flex-row"
            }
          >
            {week.map((cell, dayIndex) => {
              const key = toLocalDateString(cell.date);
              return (
                <CalendarDay
                  key={dayIndex}
                  cell={cell}
                  selected={key === selectedDateKey}
                  eventTypes={eventTypesByDay[key] ?? EMPTY_EVENT_TYPES}
                  hasFeatured={featuredDays.has(key)}
                  onPress={onDayPress}
                  onLongPress={onDayLongPress}
                />
              );
            })}
          </View>
        ))}
      </View>
    );
  },
);

CalendarMonth.displayName = "CalendarMonth";
