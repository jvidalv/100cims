import { isToday } from "date-fns";
import { memo } from "react";
import { TouchableOpacity, View } from "react-native";
import { twMerge } from "tailwind-merge";

import { ThemedText } from "@/components/ui/atoms";

type Props = {
  date: Date | null;
  onPress: (date: Date) => void;
  onLongPress: (date: Date) => void;
};

export const CalendarDay = memo(({ date, onPress, onLongPress }: Props) => {
  if (!date) return <View className="h-full flex-1" />;

  const today = isToday(date);

  return (
    <TouchableOpacity
      className="h-full flex-1 items-center justify-center"
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
            today ? "font-bold text-white" : "text-foreground",
          )}
        >
          {date.getDate()}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );
});

CalendarDay.displayName = "CalendarDay";
