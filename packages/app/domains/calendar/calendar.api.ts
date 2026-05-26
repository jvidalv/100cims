import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/components/providers/auth-provider";
import { Colors } from "@/constants/colors";
import apiClient from "@/lib/api-client";
import { calendarKeys } from "@/lib/query-keys";

export type CalendarEvent =
  // Discriminated union — extend with new event types as they're added on the
  // backend. The mobile rendering switches on `type`, so existing branches
  // never change when a new event is appended.
  | {
      type: "summit";
      date: string;
      id: string;
      mountainName: string;
      mountainSlug: string;
      mountainHeight: string;
      mountainImageUrl: string | null;
    }
  | {
      type: "plan";
      date: string;
      id: string;
      title: string;
      status: "open" | "completed" | "canceled";
      planType: "hike" | "trail" | "bike" | null;
      isPrivate: boolean;
      isCreator: boolean;
      imageUrl: string | null;
      mountains: { imageUrl: string | null }[];
      users: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        imageUrl: string | null;
      }[];
    };

export type CalendarEventType = CalendarEvent["type"];

/**
 * Colors for the dots under each day, keyed by event type. Typed against the
 * union's `type` field — adding a new event type without a color here is a
 * compile error, so the visual mapping stays in lockstep with the data.
 */
export const CALENDAR_EVENT_DOT_COLOR: Record<CalendarEventType, string> = {
  summit: Colors.light.success,
  plan: Colors.light.accent,
};

export const useCalendarEvents = ({
  from,
  to,
}: {
  from: string;
  to: string;
}) => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: calendarKeys.events(from, to),
    enabled: () => isAuthenticated,
    // Summits don't change minute-to-minute; refetch only after 5 minutes so
    // tab switches don't trigger a round trip every time.
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await apiClient.GET(
        "/api/protected/user/calendar",
        { params: { query: { from, to } } },
      );
      if (error) throw error;
      return data.message.events as CalendarEvent[];
    },
  });
};
