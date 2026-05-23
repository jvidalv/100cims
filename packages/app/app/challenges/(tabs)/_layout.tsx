import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useIntl } from "react-intl";

import { Colors } from "@/constants/colors";

/**
 * Native tab bar for the /challenges section (Official / Community).
 *
 * This is a SEPARATE NativeTabs from the main app bar (app/(app)/(tabs)).
 * Native tabs can't be nested, but they CAN be sibling subtrees — the user
 * is in one or the other at a time, never both. When the user navigates to
 * /challenges/* the main bar is replaced by this one.
 */
export default function ChallengesTabsLayout() {
  const intl = useIntl();
  return (
    <NativeTabs
      disableTransparentOnScrollEdge
      tintColor={Colors.light.primary}
    >
      <NativeTabs.Trigger name="official">
        <NativeTabs.Trigger.Icon sf="flag.fill" md="flag" />
        <NativeTabs.Trigger.Label>
          {intl.formatMessage({ defaultMessage: "Official" })}
        </NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="community">
        <NativeTabs.Trigger.Icon sf="person.2.fill" md="group" />
        <NativeTabs.Trigger.Label>
          {intl.formatMessage({ defaultMessage: "Community" })}
        </NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
