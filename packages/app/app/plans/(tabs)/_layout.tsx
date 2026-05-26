import { usePathname } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useIntl } from "react-intl";

import { Colors } from "@/constants/colors";

/**
 * Native tab bar for /plans/*: Plans list + New plan create flow.
 *
 * Sibling subtree to the other NativeTabs in the app (main app bar,
 * challenges, mountain detail). Only one bar is mounted at a time.
 *
 * The Create tab is a multi-step form rather than a destination — eagerly
 * mounted by NativeTabs like the other tab screens. Form state survives
 * tab switches; on successful submission the create screen navigates
 * elsewhere (see plans/(tabs)/create.tsx).
 *
 * The bar is hidden while the user is in the create flow so the form's
 * bottom action buttons (Continue / Back) aren't obscured by the tab bar.
 * `hidden` on NativeTabs (NOT on a Trigger) doesn't remount the navigator,
 * so form state survives showing/hiding the bar.
 */
export default function PlansTabsLayout() {
  const intl = useIntl();
  const pathname = usePathname();
  const isOnCreate = pathname === "/plans/create";
  return (
    <NativeTabs
      hidden={isOnCreate}
      disableTransparentOnScrollEdge
      tintColor={Colors.light.primary}
      // Android default collapses inactive tab labels to icons (Material
      // BottomNavigationView). "labeled" keeps every label visible and
      // matches iOS. Same setting on the main `(tabs)/_layout.tsx`.
      labelVisibilityMode="labeled"
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf="list.bullet" md="list" />
        <NativeTabs.Trigger.Label>
          {intl.formatMessage({ defaultMessage: "Plans" })}
        </NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="create">
        <NativeTabs.Trigger.Icon sf="plus.circle.fill" md="add_circle" />
        <NativeTabs.Trigger.Label>
          {intl.formatMessage({ defaultMessage: "New" })}
        </NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
