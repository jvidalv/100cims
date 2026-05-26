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
  // dedupes them, so the count is free (no extra network).
  const { slug } = useGlobalSearchParams<{ slug: string }>();
  const { data: mountain } = useMountainOne({ mountainSlug: slug });
  const { data: topComments } = useTopMountainComments(mountain?.id);
  const commentCount = topComments?.total ?? 0;
  // Label flips to "Comments (5)" / "Comments (+99)" when there are any.
  // Cap at +99 so the tab label doesn't blow up on long counts.
  const commentsLabel = intl.formatMessage({ defaultMessage: "Comments" });
  const commentsLabelWithCount =
    commentCount === 0
      ? commentsLabel
      : `${commentsLabel} (${commentCount > 99 ? "+99" : commentCount})`;
  return (
    <NativeTabs
      disableTransparentOnScrollEdge
      tintColor={Colors.light.primary}
    >
      {/* `(details)` is a route GROUP — invisible in URLs, so this tab
          stays at `/mountain/[slug]` while letting "All summits" and any
          future Details children live inside its stack. Trigger name
          matches the folder name including parens. See
          `.claude/skills/app/SKILL.md` NativeTabs gotchas. */}
      <NativeTabs.Trigger name="(details)">
        <NativeTabs.Trigger.Icon sf="info.circle.fill" md="info" />
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
        <NativeTabs.Trigger.Label>{commentsLabelWithCount}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
