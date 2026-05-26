import { format } from "date-fns/format";
import { useRouter } from "expo-router";
import { Backpack, Calendar, Plus } from "lucide-react-native";
import { useCallback, useMemo, useRef, useState } from "react";
import { useIntl } from "react-intl";
import {
  FlatList,
  type LayoutChangeEvent,
  type ListRenderItem,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
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

  // Track the currently-visible month in a ref (not state) so we can skip
  // no-op animated scrolls without causing a re-render on every swipe. The
  // initial value matches the FlatList's initialScrollIndex.
  const visibleMonthIndexRef = useRef(MONTHS_BACK);
  const onMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (pageHeight === 0) return;
      visibleMonthIndexRef.current = Math.round(
        event.nativeEvent.contentOffset.y / pageHeight,
      );
    },
    [pageHeight],
  );

  // Android workaround for the `pagingEnabled` + `initialScrollIndex` bug.
  const onListLayoutOnce = useRef(false);
  const onListLayout = useCallback(() => {
    if (!isAndroid || onListLayoutOnce.current) return;
    onListLayoutOnce.current = true;
    listRef.current?.scrollToIndex({ index: MONTHS_BACK, animated: false });
  }, []);

  // Tapping a day selects it and, only if the day belongs to a different
  // month than the one currently in view, scrolls the FlatList. Calling
  // `scrollToIndex` on the same page with `animated: true` triggers a tiny
  // visible animation cycle (looks like a one-frame swipe-down twitch) even
  // though the offset doesn't change — gate on the ref to avoid it.
  const onDayPress = useCallback(
    (date: Date) => {
      const key = toLocalDateString(date);
      setSelectedDateKey(key);
      const monthKey = key.slice(0, 7);
      const idx = months.findIndex((m) => m.key === monthKey);
      if (idx >= 0 && idx !== visibleMonthIndexRef.current) {
        listRef.current?.scrollToIndex({ index: idx, animated: true });
        visibleMonthIndexRef.current = idx;
      }
    },
    [months],
  );

  const onJumpToToday = useCallback(() => {
    onDayPress(new Date());
  }, [onDayPress]);

  const lastMonthIndex = months.length - 1;
  const onNavigateMonth = useCallback(
    (currentIndex: number, direction: "prev" | "next") => {
      const target = direction === "next" ? currentIndex + 1 : currentIndex - 1;
      if (target < 0 || target > lastMonthIndex) return;
      listRef.current?.scrollToIndex({ index: target, animated: true });
    },
    [lastMonthIndex],
  );

  const renderMonth: ListRenderItem<CalendarMonthData> = useCallback(
    ({ item, index }) => {
      // Flip the button at the last month so users at the end of the range
      // get a way back without scrolling. The label is the adjacent month's
      // own name (e.g. "June" when viewing May) — already locale-formatted.
      const navDirection = index === lastMonthIndex ? "prev" : "next";
      const adjacentIndex = navDirection === "next" ? index + 1 : index - 1;
      const navLabel = months[adjacentIndex]?.label ?? "";
      return (
        <CalendarMonth
          month={item}
          height={pageHeight}
          selectedDateKey={selectedDateKey}
          eventTypesByDay={eventTypesByDay}
          navDirection={navDirection}
          navLabel={navLabel}
          onDayPress={onDayPress}
          onDayLongPress={onDayLongPress}
          onNavigate={(direction) => onNavigateMonth(index, direction)}
        />
      );
    },
    [
      months,
      pageHeight,
      selectedDateKey,
      eventTypesByDay,
      lastMonthIndex,
      onDayPress,
      onDayLongPress,
      onNavigateMonth,
    ],
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
            onMomentumScrollEnd={onMomentumScrollEnd}
            renderItem={renderMonth}
          />
        )}
      </View>

      <View className="flex-1">
        <View className="px-6 pt-4">
          <ThemedText className="text-lg font-bold capitalize">
            {selectedDateLabel}
            {isSelectedToday && (
              <ThemedText className="text-lg font-bold text-muted-foreground/50">
                {" "}
                {intl.formatMessage({ defaultMessage: "Today" })}
              </ThemedText>
            )}
          </ThemedText>
        </View>
        <FlatList
          className="flex-1"
          data={selectedEvents}
          keyExtractor={(event) => `${event.type}-${event.id}`}
          contentContainerClassName="py-2"
          renderItem={renderEvent}
          ListFooterComponent={
            // Single cohesive action block. Rendered as the list footer so it
            // sits below events when the day has any, and right under the
            // date header when the list is empty. `Create plan` and `Back to
            // today` are conditional; `All plans` is always visible.
            // The divider + top margin only appear when there are events
            // above — otherwise the line floats with nothing to separate.
            <View
              className={
                selectedEvents.length > 0
                  ? "mt-2 gap-2.5 border-t border-border px-6 pt-4"
                  : "gap-2.5 px-6 pt-4"
              }
            >
              {!isSelectedPast && (
                <ActionRow
                  icon={Plus}
                  intent="primary"
                  size="sm"
                  onPress={() =>
                    router.push({
                      pathname: "/plans/create",
                      params: { date: selectedDateKey },
                    })
                  }
                >
                  {intl.formatMessage({ defaultMessage: "Create plan" })}
                </ActionRow>
              )}
              <ActionRow
                icon={Backpack}
                intent="accent"
                size="sm"
                onPress={() => router.push("/plans")}
              >
                {intl.formatMessage({ defaultMessage: "All plans" })}
              </ActionRow>
              {!isSelectedToday && (
                <ActionRow
                  icon={Calendar}
                  intent="muted"
                  size="sm"
                  onPress={onJumpToToday}
                >
                  {intl.formatMessage({ defaultMessage: "Back to today" })}
                </ActionRow>
              )}
            </View>
          }
        />
      </View>
    </ThemedView>
  );
}
