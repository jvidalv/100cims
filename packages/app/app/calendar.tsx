import { useCallback, useMemo } from "react";
import { FormattedMessage } from "react-intl";
import { FlatList, View } from "react-native";

import { CalendarMonth } from "@/components/calendar";
import { ThemedView } from "@/components/ui/atoms";
import { ScreenHeader } from "@/components/ui/molecules";
import { buildCalendarRange, CALENDAR_MONTH_HEIGHT } from "@/lib/calendar";
import { toLocalDateString } from "@/lib/dates";

const MONTHS_BACK = 1;

export default function CalendarScreen() {
  const months = useMemo(() => buildCalendarRange(MONTHS_BACK), []);

  const onDayPress = useCallback((date: Date) => {
    console.log("calendar day press", toLocalDateString(date));
  }, []);

  const onDayLongPress = useCallback((date: Date) => {
    console.log("calendar day long press", toLocalDateString(date));
  }, []);

  return (
    <ThemedView className="flex-1">
      <ScreenHeader>
        <FormattedMessage defaultMessage="Calendar" />
      </ScreenHeader>
      <FlatList
        data={months}
        keyExtractor={(month) => month.key}
        initialScrollIndex={MONTHS_BACK}
        getItemLayout={(_, index) => ({
          length: CALENDAR_MONTH_HEIGHT,
          offset: CALENDAR_MONTH_HEIGHT * index,
          index,
        })}
        showsVerticalScrollIndicator={false}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        ListFooterComponent={<View className="h-24" />}
        renderItem={({ item }) => (
          <CalendarMonth
            month={item}
            onDayPress={onDayPress}
            onDayLongPress={onDayLongPress}
          />
        )}
      />
    </ThemedView>
  );
}
