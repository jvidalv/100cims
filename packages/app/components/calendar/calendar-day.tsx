import { isToday } from "date-fns";
import { User } from "lucide-react-native";
import { memo } from "react";
import { TouchableOpacity, View } from "react-native";
import { twMerge } from "tailwind-merge";

import { FeaturedStar, ThemedText } from "@/components/ui/atoms";
import {
  CALENDAR_EVENT_DOT_COLOR,
  type CalendarEventType,
} from "@/domains/calendar/calendar.api";
import { type CalendarCell } from "@/lib/calendar";

// Tailwind blue-500 — same tone the plan-list "Open" label and the
// chat "Organizer" badge use, so the "you're in this plan" cue reads
// as the same affordance across surfaces.
const JOINED_COLOR = "#3b82f6";

type Props = {
  cell: CalendarCell;
  selected: boolean;
  eventTypes: CalendarEventType[];
  /** Day has at least one featured plan. Draws a small golden star next
   *  to the event-type dots. */
  hasFeatured: boolean;
  /** Viewer is part of at least one plan on this day. Draws a small bluish
   *  person icon next to the dots — purely decorative, the day number +
   *  event-type dots already carry the semantic content. */
  hasJoined: boolean;
  onPress: (date: Date) => void;
  onLongPress: (date: Date) => void;
};

export const CalendarDay = memo(
  ({
    cell,
    selected,
    eventTypes,
    hasFeatured,
    hasJoined,
    onPress,
    onLongPress,
  }: Props) => {
    const { date, inMonth } = cell;
    const today = isToday(date);

    // Color the number to communicate selected / today / out-of-month, instead
    // of drawing a circle behind it. Selected wins over today when both apply,
    // so tapping today swaps it to the blue selected color (clear feedback
    // that the tap registered even though it's already the focused day).
    // Selected stays bold; today only gets color (bold made the cell width
    // shift slightly day-to-day, causing the grid to jitter).
    const numberClass = selected
      ? "font-bold text-link"
      : today
        ? "text-primary"
        : inMonth
          ? "text-foreground"
          : "text-muted-foreground opacity-40";

    return (
      <TouchableOpacity
        className={twMerge(
          "h-full flex-1 items-center pt-1",
          selected && "bg-link/10 dark:bg-link/30",
        )}
        onPress={() => onPress(date)}
        onLongPress={() => onLongPress(date)}
      >
        <ThemedText className={twMerge("text-base", numberClass)}>
          {date.getDate()}
        </ThemedText>
        <View className="flex-1 items-center justify-center">
          {(eventTypes.length > 0 || hasFeatured || hasJoined) && (
            <View className="flex-row items-center gap-1">
              {hasFeatured && <FeaturedStar size={10} decorative />}
              {hasJoined && (
                <User
                  size={10}
                  color={JOINED_COLOR}
                  fill={JOINED_COLOR}
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                />
              )}
              {eventTypes.map((type) => (
                <View
                  key={type}
                  className="size-1.5 rounded-full"
                  style={{ backgroundColor: CALENDAR_EVENT_DOT_COLOR[type] }}
                />
              ))}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  },
);

CalendarDay.displayName = "CalendarDay";
