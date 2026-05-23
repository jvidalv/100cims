import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  FlatList,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  View,
} from "react-native";

import { CalendarEventRow, CalendarMonth } from "@/components/calendar";
import { ThemedText, ThemedView } from "@/components/ui/atoms";
import {
  type CalendarEvent,
  type CalendarEventType,
  useCalendarEvents,
} from "@/domains/calendar/calendar.api";
import {
  buildCalendarRange,
  type CalendarMonthData,
} from "@/lib/calendar";
import { toLocalDateString } from "@/lib/dates";
import { isAndroid } from "@/lib/device";

const MONTHS_BACK = 1;
const MONTHS_FORWARD = 12;
// Top half of the screen hosts the paged month grid; bottom is the events list.
const MONTH_HEIGHT_RATIO = 0.45;

export default function CalendarScreen() {
  const months = useMemo(
    () => buildCalendarRange(MONTHS_BACK, MONTHS_FORWARD),
    [],
  );

  // The page height is the FlatList's own measured height — the calendar
  // surface gets MONTH_HEIGHT_RATIO of whatever the parent gives us. Don't
  // render until measured, otherwise paging snaps to the wrong offset.
  const [pageHeight, setPageHeight] = useState(0);
  const onMonthAreaLayout = useCallback((event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.height;
    setPageHeight((prev) => (prev === next ? prev : next));
  }, []);

  // Fetch events for the full visible window (one round trip). The endpoint
  // returns YYYY-MM-DD dates already, so grouping is a plain object lookup.
  const range = useMemo(() => {
    const first = months[0]?.weeks[0]?.[0]?.date;
    const last = months[months.length - 1]?.weeks.at(-1)?.at(-1)?.date;
    return first && last
      ? { from: toLocalDateString(first), to: toLocalDateString(last) }
      : null;
  }, [months]);

  const { data: events } = useCalendarEvents(
    range ?? { from: "", to: "" },
  );

  const { eventTypesByDay, eventsByDay } = useMemo(() => {
    const types: Record<string, CalendarEventType[]> = {};
    const list: Record<string, CalendarEvent[]> = {};
    for (const event of events ?? []) {
      (list[event.date] ??= []).push(event);
      const seen = (types[event.date] ??= []);
      if (!seen.includes(event.type)) seen.push(event.type);
    }
    return { eventTypesByDay: types, eventsByDay: list };
  }, [events]);

  // Default selection = today. Tapping a day swaps it.
  const todayKey = useMemo(() => toLocalDateString(new Date()), []);
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);

  const onDayPress = useCallback((date: Date) => {
    setSelectedDateKey(toLocalDateString(date));
  }, []);

  const onDayLongPress = useCallback((date: Date) => {
    console.log("calendar day long press", toLocalDateString(date));
  }, []);

  // Year label tracks the currently visible month. Paged scrolling means
  // exactly one month is visible at a time; we read it off the scroll offset.
  const listRef = useRef<FlatList<CalendarMonthData>>(null);
  const [visibleMonthIndex, setVisibleMonthIndex] = useState(MONTHS_BACK);
  const onMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (pageHeight === 0) return;
      const index = Math.round(
        event.nativeEvent.contentOffset.y / pageHeight,
      );
      setVisibleMonthIndex(index);
    },
    [pageHeight],
  );
  const visibleYear = months[visibleMonthIndex]?.weeks[1]?.[0]?.date
    .getFullYear();

  // Android workaround for the `pagingEnabled` + `initialScrollIndex` bug.
  const onListLayoutOnce = useRef(false);
  const onListLayout = useCallback(() => {
    if (!isAndroid || onListLayoutOnce.current) return;
    onListLayoutOnce.current = true;
    listRef.current?.scrollToIndex({ index: MONTHS_BACK, animated: false });
  }, []);

  // When the selected day changes (today on mount, or user tap), keep the
  // visible month in sync if the user picks a day in a different month.
  useEffect(() => {
    const idx = months.findIndex((m) =>
      m.weeks.some((w) =>
        w.some(
          (c) => c.inMonth && toLocalDateString(c.date) === selectedDateKey,
        ),
      ),
    );
    if (idx >= 0 && idx !== visibleMonthIndex) {
      setVisibleMonthIndex(idx);
      listRef.current?.scrollToIndex({ index: idx, animated: true });
    }
    // visibleMonthIndex intentionally omitted: this effect only reacts to
    // selection changes, not to scrolls (which already update visibleMonthIndex).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDateKey, months]);

  const selectedEvents = eventsByDay[selectedDateKey] ?? EMPTY_EVENTS;

  return (
    <ThemedView className="flex-1">
      <View className="h-14 flex-row items-center px-6">
        <ThemedText className="text-2xl font-bold">{visibleYear}</ThemedText>
      </View>

      <View
        className="border-b border-border"
        style={{ height: pageHeight || undefined, flexBasis: `${MONTH_HEIGHT_RATIO * 100}%` }}
        onLayout={onMonthAreaLayout}
      >
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
            onMomentumScrollEnd={onMomentumScrollEnd}
            renderItem={({ item }) => (
              <CalendarMonth
                month={item}
                height={pageHeight}
                selectedDateKey={selectedDateKey}
                eventTypesByDay={eventTypesByDay}
                onDayPress={onDayPress}
                onDayLongPress={onDayLongPress}
              />
            )}
          />
        )}
      </View>

      <FlatList
        className="flex-1"
        data={selectedEvents}
        keyExtractor={(event) => `${event.type}-${event.id}`}
        contentContainerClassName="py-2"
        renderItem={({ item }) => <CalendarEventRow event={item} />}
      />
    </ThemedView>
  );
}

const EMPTY_EVENTS: CalendarEvent[] = [];
