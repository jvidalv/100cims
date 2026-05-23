import { format } from "date-fns/format";
import { useRouter } from "expo-router";
import { Calendar, Plus } from "lucide-react-native";
import { useCallback, useMemo, useRef, useState } from "react";
import { useIntl } from "react-intl";
import {
  FlatList,
  type LayoutChangeEvent,
  type ListRenderItem,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CalendarEventRow, CalendarMonth } from "@/components/calendar";
import { ThemedText, ThemedView } from "@/components/ui/atoms";
import { ActionRow } from "@/components/ui/molecules";
import {
  type CalendarEvent,
  type CalendarEventType,
  useCalendarEvents,
} from "@/domains/calendar/calendar.api";
import {
  buildCalendarRange,
  type CalendarMonthData,
} from "@/lib/calendar";
import { parseLocalDateString, toLocalDateString } from "@/lib/dates";
import { isAndroid } from "@/lib/device";
import { getDateFnsLocale } from "@/lib/locale";

const MONTHS_BACK = 1;
const MONTHS_FORWARD = 12;
// Top half of the screen hosts the paged month grid; bottom is the events list.
const MONTH_HEIGHT_RATIO = 0.45;

const EMPTY_EVENTS: CalendarEvent[] = [];

export default function CalendarScreen() {
  const intl = useIntl();
  const router = useRouter();
  const { top: topInset } = useSafeAreaInsets();
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

  // Fetch events for the full visible window (one round trip). The bounds
  // walk through the grid (not startOfMonth/endOfMonth) so leading/trailing
  // dim cells from adjacent months are included too.
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

  const onDayLongPress = useCallback((date: Date) => {
    console.log("calendar day long press", toLocalDateString(date));
  }, []);

  const listRef = useRef<FlatList<CalendarMonthData>>(null);

  // Android workaround for the `pagingEnabled` + `initialScrollIndex` bug.
  const onListLayoutOnce = useRef(false);
  const onListLayout = useCallback(() => {
    if (!isAndroid || onListLayoutOnce.current) return;
    onListLayoutOnce.current = true;
    listRef.current?.scrollToIndex({ index: MONTHS_BACK, animated: false });
  }, []);

  // Tapping a day selects it and scrolls the FlatList to its month. If the
  // day is already in the visible page the scrollToIndex is a no-op — cheap
  // and avoids tracking the visible index in state.
  const onDayPress = useCallback(
    (date: Date) => {
      const key = toLocalDateString(date);
      setSelectedDateKey(key);
      const monthKey = key.slice(0, 7);
      const idx = months.findIndex((m) => m.key === monthKey);
      if (idx >= 0) {
        listRef.current?.scrollToIndex({ index: idx, animated: true });
      }
    },
    [months],
  );

  const onJumpToToday = useCallback(() => {
    onDayPress(new Date());
  }, [onDayPress]);

  const renderMonth: ListRenderItem<CalendarMonthData> = useCallback(
    ({ item }) => (
      <CalendarMonth
        month={item}
        height={pageHeight}
        selectedDateKey={selectedDateKey}
        eventTypesByDay={eventTypesByDay}
        onDayPress={onDayPress}
        onDayLongPress={onDayLongPress}
      />
    ),
    [pageHeight, selectedDateKey, eventTypesByDay, onDayPress, onDayLongPress],
  );

  const renderEvent: ListRenderItem<CalendarEvent> = useCallback(
    ({ item }) => <CalendarEventRow event={item} />,
    [],
  );

  const selectedEvents = eventsByDay[selectedDateKey] ?? EMPTY_EVENTS;
  const selectedDateLabel = format(
    parseLocalDateString(selectedDateKey),
    "d MMMM yyyy",
    { locale: getDateFnsLocale() },
  );
  // YYYY-MM-DD strings compare chronologically, so a plain `<` works.
  const isSelectedPast = selectedDateKey < todayKey;
  const isSelectedToday = selectedDateKey === todayKey;

  return (
    <ThemedView className="flex-1" style={{ paddingTop: topInset }}>
      <View
        className="border-b-2 border-border"
        style={{
          height: pageHeight || undefined,
          flexBasis: `${MONTH_HEIGHT_RATIO * 100}%`,
        }}
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
            renderItem={renderMonth}
          />
        )}
      </View>

      <View className="flex-1">
        <View className="px-6 pt-4">
          <ThemedText className="text-lg font-bold capitalize">
            {selectedDateLabel}
          </ThemedText>
        </View>
        <FlatList
          className="flex-1"
          data={selectedEvents}
          keyExtractor={(event) => `${event.type}-${event.id}`}
          contentContainerClassName="py-2"
          renderItem={renderEvent}
          ListEmptyComponent={
            <View className="gap-2 px-6 py-6">
              {!isSelectedPast && (
                <ActionRow
                  icon={Plus}
                  intent="primary"
                  size="lg"
                  onPress={() => router.push("/plan/create")}
                >
                  {intl.formatMessage({ defaultMessage: "Create plan" })}
                </ActionRow>
              )}
              {!isSelectedToday && (
                <ActionRow
                  icon={Calendar}
                  intent="muted"
                  size="lg"
                  onPress={onJumpToToday}
                >
                  {intl.formatMessage({ defaultMessage: "Today" })}
                </ActionRow>
              )}
            </View>
          }
        />
      </View>
    </ThemedView>
  );
}
