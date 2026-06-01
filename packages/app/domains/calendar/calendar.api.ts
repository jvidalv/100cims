import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/components/providers/auth-provider";
import { Colors } from "@/constants/colors";
import apiClient from "@/lib/api-client";
import { calendarKeys } from "@/lib/query-keys";
import type { paths } from "@/types/api";

// Discriminated union derived from the API's OpenAPI schema. The mobile
// rendering switches on `type`, so adding a new event variant on the
// backend produces an exhaustiveness error here without needing a local
// type to be kept in lockstep.
export type CalendarEvent =
  paths["/api/protected/user/calendar"]["get"]["responses"][200]["content"]["application/json"]["message"]["events"][number];

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

  // Two endpoints, identical response shape (`CalendarResponseSchema`):
  // - protected: user's own summits + plans they joined/created
  // - public:    every non-private plan in the window, no summits
  // The mobile consumer doesn't care which one served the data — the
  // `CalendarEvent` discriminated union is derived from the protected
  // schema and the public payload is a subset of it.
  return useQuery({
    queryKey: calendarKeys.events(from, to, isAuthenticated),
    // Summits don't change minute-to-minute; refetch only after 5 minutes so
    // tab switches don't trigger a round trip every time.
    staleTime: 5 * 60_000,
    queryFn: async () => {
      if (isAuthenticated) {
        const { data, error } = await apiClient.GET(
          "/api/protected/user/calendar",
          { params: { query: { from, to } } },
        );
        if (error) throw error;
        return data.message.events;
      }
      const { data, error } = await apiClient.GET(
        "/api/public/plans/calendar",
        { params: { query: { from, to } } },
      );
      if (error) throw error;
      return data.message.events;
    },
  });
};
