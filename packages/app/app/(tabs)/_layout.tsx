import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useIntl } from "react-intl";

import { Colors } from "@/constants/colors";

export default function TabsLayout() {
  const intl = useIntl();
  return (
    // `disableTransparentOnScrollEdge` keeps the bar's blurred material when
    // the user scrolls to the very bottom of a list. Without it, iOS 18 and
    // earlier render the bar as fully transparent at the scroll edge, which
    // reads as broken. iOS 26+ liquid glass ignores the flag.
    // `tintColor` is the brand primary (rose), same in light + dark.
    <NativeTabs
      disableTransparentOnScrollEdge
      tintColor={Colors.light.primary}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
        <NativeTabs.Trigger.Label>
          {intl.formatMessage({ defaultMessage: "Home" })}
        </NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="mountains">
        <NativeTabs.Trigger.Icon sf="mountain.2.fill" md="terrain" />
        <NativeTabs.Trigger.Label>
          {intl.formatMessage({ defaultMessage: "Mountains" })}
        </NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="calendar">
        <NativeTabs.Trigger.Icon sf="calendar" md="calendar_month" />
        <NativeTabs.Trigger.Label>
          {intl.formatMessage({ defaultMessage: "Events" })}
        </NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="shop">
        <NativeTabs.Trigger.Icon sf="bag.fill" md="shopping_bag" />
        <NativeTabs.Trigger.Label>
          {intl.formatMessage({ defaultMessage: "Shop" })}
        </NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
