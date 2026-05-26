import { isToday } from "date-fns";
import { memo } from "react";
import { TouchableOpacity, View } from "react-native";
import { twMerge } from "tailwind-merge";

import { ThemedText } from "@/components/ui/atoms";
import {
  CALENDAR_EVENT_DOT_COLOR,
  type CalendarEventType,
} from "@/domains/calendar/calendar.api";
import { type CalendarCell } from "@/lib/calendar";

type Props = {
  cell: CalendarCell;
  selected: boolean;
  eventTypes: CalendarEventType[];
  onPress: (date: Date) => void;
  onLongPress: (date: Date) => void;
};

export const CalendarDay = memo(
  ({ cell, selected, eventTypes, onPress, onLongPress }: Props) => {
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
          {eventTypes.length > 0 && (
            <View className="flex-row gap-1">
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
