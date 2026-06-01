import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useIntl } from "react-intl";

import { useAuth } from "@/components/providers/auth-provider";
import { Colors } from "@/constants/colors";
import { useCartCount } from "@/domains/merch/cart";
import { useMerch } from "@/domains/merch/merch.api";
import { useUnseenNewCount } from "@/domains/merch/seen";
import { useNewPlansCount } from "@/domains/plan/plan.api";

export default function TabsLayout() {
  const intl = useIntl();
  // Server-backed "new plans since you last visited" count. Drives the
  // badge on the calendar bottom-tab. Mutated to 0 when the user opens
  // /calendar or /plans (see those screens).
  const { isAuthenticated } = useAuth();
  const { data: newPlansData } = useNewPlansCount();
  const newPlansCount = isAuthenticated ? (newPlansData?.count ?? 0) : 0;
  // Cart lives in AsyncStorage, so the count is auth-independent — an
  // unauthenticated user with stored items still sees the badge and gets
  // funneled through /join when they tap into /shop/cart.
  const cartCount = useCartCount();
  // "New" indicator on the shop tab when there's at least one unseen product
  // created in the last 7 days. Cart count takes precedence — NativeTabs
  // exposes a single badge slot per trigger, and cart is the more actionable
  // signal. `useMerch()` is shared cache; this is not an extra fetch.
  const { data: merch } = useMerch();
  const unseenNewCount = useUnseenNewCount(merch);
  const shopBadge =
    cartCount > 0
      ? String(cartCount)
      : unseenNewCount > 0
        ? intl.formatMessage({ defaultMessage: "New" })
        : null;
  return (
    // `disableTransparentOnScrollEdge` keeps the bar's blurred material when
    // the user scrolls to the very bottom of a list. Without it, iOS 18 and
    // earlier render the bar as fully transparent at the scroll edge, which
    // reads as broken. iOS 26+ liquid glass ignores the flag.
    // `tintColor` is the brand primary (rose), same in light + dark.
    <NativeTabs
      disableTransparentOnScrollEdge
      tintColor={Colors.light.primary}
      // Brand the calendar badge with the app's primary (rose) instead of
      // the platform default (red). Applies to every tab's badge — only
      // calendar has one today.
      badgeBackgroundColor={Colors.light.primary}
      // Force labels visible on every tab — Android's default
      // `labelVisibilityMode="auto"` hides the label on unselected tabs
      // once you have >3 tabs (Material BottomNavigationView behavior),
      // leaving 4 icons + 1 labeled selected one. "labeled" matches iOS,
      // and makes the bottom bar self-explanatory regardless of platform.
      labelVisibilityMode="labeled"
      // Suppress the Android Material ripple on tab taps. The default is
      // the brand primary (rose) which flashes loud on every tap; iOS has
      // no equivalent and feels instant. Transparent gives Android the
      // same instant-tap feel. The selected-tab pill indicator
      // (`disableIndicator`) is intentionally left enabled to keep the
      // Material selection affordance.
      rippleColor="transparent"
    >
      {/* `(home)` is a route GROUP — invisible in URLs, so the dashboard
          stays at "/" while letting Latest summits and any future Home
          children live inside this tab's stack. Trigger name matches the
          folder name including parens. */}
      <NativeTabs.Trigger name="(home)">
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
        {newPlansCount > 0 && (
          <NativeTabs.Trigger.Badge>
            {String(newPlansCount)}
          </NativeTabs.Trigger.Badge>
        )}
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="shop">
        <NativeTabs.Trigger.Icon sf="bag.fill" md="shopping_bag" />
        <NativeTabs.Trigger.Label>
          {intl.formatMessage({ defaultMessage: "Shop" })}
        </NativeTabs.Trigger.Label>
        {shopBadge && (
          <NativeTabs.Trigger.Badge>{shopBadge}</NativeTabs.Trigger.Badge>
        )}
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
