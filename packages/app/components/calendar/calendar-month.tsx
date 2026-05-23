import { memo, useMemo } from "react";
import { View } from "react-native";

import { ThemedText } from "@/components/ui/atoms";
import { type CalendarMonthData, getWeekdayLabels } from "@/lib/calendar";

import { CalendarDay } from "./calendar-day";

type Props = {
  month: CalendarMonthData;
  height: number;
  onDayPress: (date: Date) => void;
  onDayLongPress: (date: Date) => void;
};

export const CalendarMonth = memo(
  ({ month, height, onDayPress, onDayLongPress }: Props) => {
    // Computed in-component (not at module scope) so it reads the locale only
    // after startup has resolved it — see lib/locale.ts initLocale.
    const weekdays = useMemo(() => getWeekdayLabels(), []);

    return (
      <View className="px-3 pb-2" style={{ height }}>
        <ThemedText className="h-16 text-4xl font-bold capitalize">
          {month.label}
        </ThemedText>
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
            {week.map((cell, dayIndex) => (
              <CalendarDay
                key={dayIndex}
                cell={cell}
                onPress={onDayPress}
                onLongPress={onDayLongPress}
              />
            ))}
          </View>
        ))}
      </View>
    );
  },
);

CalendarMonth.displayName = "CalendarMonth";
