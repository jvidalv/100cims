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

    return (
      <TouchableOpacity
        className="h-full flex-1 items-center justify-start pt-2"
        onPress={() => onPress(date)}
        onLongPress={() => onLongPress(date)}
      >
        <View
          className={twMerge(
            "size-9 items-center justify-center rounded-full",
            today && "bg-primary",
            !today && selected && "border-2 border-foreground",
          )}
        >
          <ThemedText
            className={twMerge(
              "text-sm",
              today
                ? "font-bold text-white"
                : selected
                  ? "font-bold text-foreground"
                  : inMonth
                    ? "text-foreground"
                    : "text-muted-foreground opacity-40",
            )}
          >
            {date.getDate()}
          </ThemedText>
        </View>
        {eventTypes.length > 0 && (
          <View className="mt-1 flex-row gap-1">
            {eventTypes.map((type) => (
              <View
                key={type}
                className="size-1.5 rounded-full"
                style={{ backgroundColor: CALENDAR_EVENT_DOT_COLOR[type] }}
              />
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  },
);

CalendarDay.displayName = "CalendarDay";
