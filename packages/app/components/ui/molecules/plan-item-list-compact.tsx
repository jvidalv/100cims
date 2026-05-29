import { isToday } from "date-fns/isToday";
import { Link } from "expo-router";
import { FormattedMessage, useIntl } from "react-intl";
import { TouchableOpacity, View } from "react-native";

import { FeaturedStar, ThemedText } from "@/components/ui/atoms";
import { AvatarGroup } from "@/components/ui/molecules/avatar-group";
import { PlanCoverBackground } from "@/components/ui/molecules/plan-cover-background";
import { type CalendarEvent } from "@/domains/calendar/calendar.api";
import { getFullName } from "@/domains/user/user.utils";
import { parseLocalDateString } from "@/lib/dates";

// Derive the prop shape from the discriminated CalendarEvent union so adding
// a field to the API only touches the union; this component picks it up for
// free. Strip CalendarEvent's `type: "plan"` discriminator and rename
// `date` -> `startDate` to match the historical PlanItemList prop name.
type CalendarPlanEvent = Extract<CalendarEvent, { type: "plan" }>;

type Props = Omit<CalendarPlanEvent, "type" | "date" | "isCreator"> & {
  startDate?: string | null;
  /** Custom plan cover image. Takes precedence over the mountain thumbnail. */
  imageUrl?: string | null;
};

/**
 * Compact variant of PlanItemList — meant for tight contexts like the
 * calendar's daily-event list, where the date is already shown in the panel
 * header. The mountain thumbnail shrinks to size-10 (matching the summit
 * row), the mountain collage flattens to a single image, the date/when
 * subtitle is dropped, and the unread badge is gone.
 */
export const PlanItemListCompact = ({
  id,
  title,
  startDate,
  status,
  planType,
  isPrivate,
  featured,
  mountains,
  users,
  imageUrl,
}: Props) => {
  const intl = useIntl();
  const coverImage =
    imageUrl ?? mountains?.find(({ imageUrl }) => imageUrl)?.imageUrl;

  const isOpen = status === "open";
  const isOngoing =
    isOpen && !!startDate && isToday(parseLocalDateString(startDate));
  const isCompleted = status === "completed";
  const isCanceled = status === "canceled";

  const planTypeLabel = planType
    ? planType === "hike"
      ? intl.formatMessage({ defaultMessage: "Hike" })
      : planType === "trail"
        ? intl.formatMessage({ defaultMessage: "Trail" })
        : intl.formatMessage({ defaultMessage: "Bike" })
    : null;

  return (
    <Link href={{ pathname: "/plan/[id]", params: { id } }} asChild>
      <TouchableOpacity className="flex-row items-center gap-3">
        <View className="size-10 overflow-hidden rounded">
          <PlanCoverBackground
            customImageUrl={coverImage}
            title={title}
            withBottomGradient={false}
            initialsSize="sm"
          />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <ThemedText
              numberOfLines={1}
              className="flex-1 font-medium"
              style={{ lineHeight: 16 }}
            >
              {title}
            </ThemedText>
            {users.length > 0 && (
              <AvatarGroup
                size="xs"
                items={users.map((user) => ({
                  name: getFullName(user),
                  imageUrl: user.imageUrl,
                }))}
              />
            )}
          </View>
          <View className="flex-row items-center gap-1">
            {isOpen && !isOngoing && (
              <ThemedText
                className="text-sm font-semibold text-blue-500"
                style={{ lineHeight: 14 }}
              >
                <FormattedMessage defaultMessage="Open" />
              </ThemedText>
            )}
            {isOpen && isOngoing && (
              <ThemedText
                className="text-sm font-semibold text-purple-500"
                style={{ lineHeight: 14 }}
              >
                <FormattedMessage defaultMessage="Ongoing" />
              </ThemedText>
            )}
            {isCompleted && (
              <ThemedText
                className="text-sm font-semibold text-emerald-500"
                style={{ lineHeight: 14 }}
              >
                <FormattedMessage defaultMessage="Completed" />
              </ThemedText>
            )}
            {isCanceled && (
              <ThemedText
                className="text-sm font-semibold text-neutral-500"
                style={{ lineHeight: 14 }}
              >
                <FormattedMessage defaultMessage="Canceled" />
              </ThemedText>
            )}
            {featured && <FeaturedStar size={12} />}
            {planTypeLabel && (
              <ThemedText
                className="text-sm text-muted-foreground"
                style={{ lineHeight: 14 }}
              >
                · {planTypeLabel}
              </ThemedText>
            )}
            {isPrivate && (
              <ThemedText
                className="text-sm font-medium text-primary"
                style={{ lineHeight: 14 }}
              >
                · <FormattedMessage defaultMessage="private" />
              </ThemedText>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Link>
  );
};
