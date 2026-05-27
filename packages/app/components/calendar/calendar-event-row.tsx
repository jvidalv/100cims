import { Link } from "expo-router";
import { memo } from "react";
import { TouchableOpacity, View } from "react-native";

import { ThemedText } from "@/components/ui/atoms";
import { Image } from "@/components/ui/atoms/image";
import { PlanItemListCompact } from "@/components/ui/molecules/plan-item-list-compact";
import {
  CALENDAR_EVENT_DOT_COLOR,
  type CalendarEvent,
} from "@/domains/calendar/calendar.api";

type Props = { event: CalendarEvent };

export const CalendarEventRow = memo(({ event }: Props) => {
  // Switch on event.type so adding a new event variant (plan, challenge…)
  // produces a TS exhaustiveness error here — the calendar list won't silently
  // fall through to nothing.
  switch (event.type) {
    case "summit":
      return (
        <Link
          href={{
            pathname: "/user/summits/[summit]",
            params: { summit: event.id },
          }}
          asChild
        >
          <TouchableOpacity className="flex-row items-center gap-3 px-6 py-1.5">
            <View
              className="w-1 self-stretch rounded-full"
              style={{ backgroundColor: CALENDAR_EVENT_DOT_COLOR.summit }}
            />
            {event.mountainImageUrl ? (
              <Image
                source={{
                  uri: event.mountainImageUrl,
                  cache: "force-cache",
                }}
                className="size-10 rounded bg-gray-400 dark:bg-gray-500"
              />
            ) : (
              <View className="size-10 rounded bg-gray-400 dark:bg-gray-500" />
            )}
            <View className="flex-1">
              <ThemedText className="font-medium" numberOfLines={1}>
                {event.mountainName}
              </ThemedText>
              <ThemedText className="text-sm text-muted-foreground">
                {event.mountainHeight}m
              </ThemedText>
            </View>
          </TouchableOpacity>
        </Link>
      );

    case "plan":
      // Compact plan row sized to match the summit row (size-10 thumbnail),
      // wrapped with the calendar's colored stripe so plan + summit rows share
      // the same visual rhythm.
      return (
        <View className="flex-row items-stretch gap-3 px-6 py-1.5">
          <View
            className="w-1 rounded-full"
            style={{ backgroundColor: CALENDAR_EVENT_DOT_COLOR.plan }}
          />
          <View className="flex-1">
            <PlanItemListCompact
              id={event.id}
              title={event.title}
              imageUrl={event.imageUrl}
              status={event.status}
              planType={event.planType}
              startDate={event.date}
              isPrivate={event.isPrivate}
              mountains={event.mountains}
              users={event.users}
            />
          </View>
        </View>
      );
  }
});

CalendarEventRow.displayName = "CalendarEventRow";
