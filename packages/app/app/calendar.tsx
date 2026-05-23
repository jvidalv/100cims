import { useCallback, useMemo, useRef, useState } from "react";
import { FormattedMessage } from "react-intl";
import {
  FlatList,
  type LayoutChangeEvent,
  View,
} from "react-native";

import { CalendarMonth } from "@/components/calendar";
import { ThemedView } from "@/components/ui/atoms";
import { ScreenHeader } from "@/components/ui/molecules";
import { buildCalendarRange, type CalendarMonthData } from "@/lib/calendar";
import { toLocalDateString } from "@/lib/dates";
import { isAndroid } from "@/lib/device";

const MONTHS_BACK = 1;

export default function CalendarScreen() {
  const months = useMemo(() => buildCalendarRange(MONTHS_BACK), []);

  // The page height is the FlatList's own measured height — works regardless
  // of header height, safe-area insets, or platform. Don't render the list
  // until we know it, otherwise paging snaps to the wrong offset.
  const [pageHeight, setPageHeight] = useState(0);
  const listRef = useRef<FlatList<CalendarMonthData>>(null);

  const onContainerLayout = useCallback((event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.height;
    setPageHeight((prev) => (prev === next ? prev : next));
  }, []);

  const onDayPress = useCallback((date: Date) => {
    console.log("calendar day press", toLocalDateString(date));
  }, []);

  const onDayLongPress = useCallback((date: Date) => {
    console.log("calendar day long press", toLocalDateString(date));
  }, []);

  // Android has a long-standing RN bug where `pagingEnabled` +
  // `initialScrollIndex` lands a page off on first mount. Push it manually
  // after layout instead of relying on initialScrollIndex.
  const onListLayoutOnce = useRef(false);
  const onListLayout = useCallback(() => {
    if (!isAndroid || onListLayoutOnce.current) return;
    onListLayoutOnce.current = true;
    listRef.current?.scrollToIndex({ index: MONTHS_BACK, animated: false });
  }, []);

  return (
    <ThemedView className="flex-1">
      <ScreenHeader>
        <FormattedMessage defaultMessage="Calendar" />
      </ScreenHeader>
      <View className="flex-1" onLayout={onContainerLayout}>
        {pageHeight > 0 && (
          <FlatList
            ref={listRef}
            data={months}
            keyExtractor={(month) => month.key}
            initialScrollIndex={isAndroid ? 0 : MONTHS_BACK}
            getItemLayout={(_, index) => ({
              length: pageHeight,
              offset: pageHeight * index,
              index,
            })}
            pagingEnabled
            showsVerticalScrollIndicator={false}
            initialNumToRender={3}
            maxToRenderPerBatch={3}
            onLayout={onListLayout}
            renderItem={({ item }) => (
              <CalendarMonth
                month={item}
                height={pageHeight}
                onDayPress={onDayPress}
                onDayLongPress={onDayLongPress}
              />
            )}
          />
        )}
      </View>
    </ThemedView>
  );
}
