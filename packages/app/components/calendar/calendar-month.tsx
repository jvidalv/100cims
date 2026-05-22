import { memo, useMemo } from "react";
import { View } from "react-native";

import { ThemedText } from "@/components/ui/atoms";
import {
  CALENDAR_MONTH_HEIGHT,
  type CalendarMonthData,
  getWeekdayLabels,
  WEEK_ROW_HEIGHT,
} from "@/lib/calendar";

import { CalendarDay } from "./calendar-day";

type Props = {
  month: CalendarMonthData;
  onDayPress: (date: Date) => void;
  onDayLongPress: (date: Date) => void;
};

export const CalendarMonth = memo(
  ({ month, onDayPress, onDayLongPress }: Props) => {
    // Computed in-component (not at module scope) so it reads the locale only
    // after startup has resolved it — see lib/locale.ts initLocale.
    const weekdays = useMemo(() => getWeekdayLabels(), []);

    return (
      // Explicit fixed height (matches getItemLayout in calendar.tsx) so the
      // FlatList never re-measures and the screen has no mount-time drift.
      <View className="px-6 pb-6" style={{ height: CALENDAR_MONTH_HEIGHT }}>
        <ThemedText className="h-7 text-lg font-bold capitalize">
          {month.label}
        </ThemedText>
        <View className="h-[18px] flex-row">
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
            className="flex-row"
            style={{ height: WEEK_ROW_HEIGHT }}
          >
            {week.map((date, dayIndex) => (
              <CalendarDay
                key={dayIndex}
                date={date}
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
