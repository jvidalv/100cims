import { useGlobalSearchParams } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useIntl } from "react-intl";

import { Colors } from "@/constants/colors";
import { useMountainOne } from "@/domains/mountain/mountain.api";
import { useTopMountainComments } from "@/domains/mountain-comments/mountain-comments.api";

/**
 * Native tab bar for /mountain/[slug]/*: View / Summit / Comments.
 *
 * This is another sibling NativeTabs (peer of (app)/(tabs) and challenges/(tabs))
 * — only one bar is ever mounted at a time, so the "no nested native tabs"
 * limitation doesn't apply.
 *
 * The folder also contains `edit.tsx` and `comment.tsx` (singular). Those are
 * intentionally NOT declared as triggers — they remain navigable routes but
 * don't get a visible tab button, matching the existing design where they're
 * sub-screens reached from inside View/Comments.
 */
export default function MountainSlugLayout() {
  const intl = useIntl();
  // Reuse the same hooks the Details screen already calls — React Query
  // dedupes them, so the badge is free (no extra network).
  const { slug } = useGlobalSearchParams<{ slug: string }>();
  const { data: mountain } = useMountainOne({ mountainSlug: slug });
  const { data: topComments } = useTopMountainComments(mountain?.id);
  const commentCount = topComments?.total ?? 0;
  // Cap the badge at 99+ — iOS tab badges look broken with 3+ digits.
  const commentBadge =
    commentCount === 0
      ? undefined
      : commentCount > 99
        ? "99+"
        : String(commentCount);
  return (
    <NativeTabs
      disableTransparentOnScrollEdge
      tintColor={Colors.light.primary}
      // Badges use the brand primary (rose). Note: `badgeTextColor` only
      // affects Android/Web — iOS always renders badge text in white.
      badgeBackgroundColor={Colors.light.primary}
      badgeTextColor="#FFFFFF"
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf="mountain.2.fill" md="terrain" />
        <NativeTabs.Trigger.Label>
          {intl.formatMessage({ defaultMessage: "Details" })}
        </NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="summit">
        <NativeTabs.Trigger.Icon
          sf="checkmark.circle.fill"
          md="check_circle"
        />
        <NativeTabs.Trigger.Label>
          {intl.formatMessage({ defaultMessage: "Summit" })}
        </NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="comments">
        <NativeTabs.Trigger.Icon sf="bubble.left.fill" md="chat_bubble" />
        <NativeTabs.Trigger.Label>
          {intl.formatMessage({ defaultMessage: "Comments" })}
        </NativeTabs.Trigger.Label>
        {commentBadge !== undefined && (
          <NativeTabs.Trigger.Badge>{commentBadge}</NativeTabs.Trigger.Badge>
        )}
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
