import { isToday } from "date-fns";
import { memo } from "react";
import { TouchableOpacity, View } from "react-native";
import { twMerge } from "tailwind-merge";

import { ThemedText } from "@/components/ui/atoms";
import { type CalendarCell } from "@/lib/calendar";

type Props = {
  cell: CalendarCell;
  onPress: (date: Date) => void;
  onLongPress: (date: Date) => void;
};

export const CalendarDay = memo(({ cell, onPress, onLongPress }: Props) => {
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
        )}
      >
        <ThemedText
          className={twMerge(
            "text-sm",
            today
              ? "font-bold text-white"
              : inMonth
                ? "text-foreground"
                : "text-muted-foreground opacity-40",
          )}
        >
          {date.getDate()}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );
});

CalendarDay.displayName = "CalendarDay";
