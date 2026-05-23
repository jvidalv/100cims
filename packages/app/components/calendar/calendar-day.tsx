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

    // Color the number to communicate today / selected / out-of-month, instead
    // of drawing a circle behind it. Today wins over selected when both apply.
    const numberClass = today
      ? "font-bold text-primary"
      : selected
        ? "font-bold text-link"
        : inMonth
          ? "text-foreground"
          : "text-muted-foreground opacity-40";

    return (
      <TouchableOpacity
        className="h-full flex-1 items-center pt-1"
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
