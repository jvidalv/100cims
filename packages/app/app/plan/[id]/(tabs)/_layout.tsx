import { useGlobalSearchParams } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useIntl } from "react-intl";

import { Colors } from "@/constants/colors";
import { usePlanChatUnread } from "@/domains/plan/plan-chat.api";
import { usePlanOne } from "@/domains/plan/plan.api";
import { useUserMe } from "@/domains/user/user.api";

/**
 * Native tab bar for /plan/[id]/*: Details, Complete, Modify, Chat.
 *
 * Sibling subtree to the other NativeTabs in the app (main app bar, plans,
 * challenges, mountain detail). Only one bar is mounted at a time.
 *
 * Complete and Modify are owner-only — they use `hidden={!isCreator}` so
 * non-owners don't see those tabs. The OS may remount the navigator once
 * when ownership resolves on first load (minor flicker); subsequent
 * navigations don't remount.
 *
 * The chat tab is visible to everyone, but its screen body shows a
 * "Join the plan" CTA when the viewer hasn't joined yet — see chat.tsx.
 *
 * Note on params: tab screens use useGlobalSearchParams (not useLocal-) for
 * [id] because NativeTabs eagerly-mounts children and useLocalSearchParams
 * doesn't bind the parent dynamic until focus. Same pattern as
 * mountain/[slug]/(tabs).
 */
export default function PlanTabsLayout() {
  const intl = useIntl();
  const { id } = useGlobalSearchParams<{ id: string }>();
  const { data: plan } = usePlanOne({ id });
  const { data: user } = useUserMe();
  const isCreator = !!user?.id && user.id === plan?.creatorId;
  // Complete is only meaningful for open plans that have a start date —
  // matches the gating the old in-content "Complete plan" ActionRow had on
  // index.tsx before the tab refactor.
  const canComplete = isCreator && plan?.status === "open" && !!plan.startDate;

  // Chat tab gets a dot badge when this plan has unread messages. The hook
  // returns a list of plan IDs the user has unread messages in; we just
  // check if the current plan is in that list. Empty-string children
  // renders as a dot indicator (no count).
  const { data: unreadPlanIds } = usePlanChatUnread();
  const hasUnreadChat = !!unreadPlanIds?.includes(id);

  return (
    <NativeTabs
      disableTransparentOnScrollEdge
      tintColor={Colors.light.primary}
      // Keep tab labels visible on Android (matches main tab bar).
      labelVisibilityMode="labeled"
      // Brand-primary dot — matches the mountain detail Comments badge.
      badgeBackgroundColor={Colors.light.primary}
      badgeTextColor="#FFFFFF"
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf="info.circle.fill" md="info" />
        <NativeTabs.Trigger.Label>
          {intl.formatMessage({ defaultMessage: "Details" })}
        </NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="complete" hidden={!canComplete}>
        <NativeTabs.Trigger.Icon
          sf="checkmark.circle.fill"
          md="check_circle"
        />
        <NativeTabs.Trigger.Label>
          {intl.formatMessage({ defaultMessage: "Complete" })}
        </NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="edit" hidden={!isCreator}>
        <NativeTabs.Trigger.Icon sf="gearshape.fill" md="settings" />
        <NativeTabs.Trigger.Label>
          {intl.formatMessage({ defaultMessage: "Modify" })}
        </NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="chat">
        <NativeTabs.Trigger.Icon sf="bubble.left.fill" md="chat_bubble" />
        <NativeTabs.Trigger.Label>
          {intl.formatMessage({ defaultMessage: "Chat" })}
        </NativeTabs.Trigger.Label>
        {hasUnreadChat && <NativeTabs.Trigger.Badge>{""}</NativeTabs.Trigger.Badge>}
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
