import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Bottom offset to clear the NativeTabs bar from floating UI (FABs, action
 * chips, banners) anchored with `position: absolute`.
 *
 * Platform behavior inside a NativeTabs subtree (`app/(tabs)`,
 * `app/plan/[id]/(tabs)`, …):
 * - **iOS** — `bottom: 0` measures from the screen's bottom edge, and
 *   `useSafeAreaInsets().bottom` already includes the 49pt UITabBar height
 *   (UIKit bumps the safe area for any UITabBarController child). Use
 *   `insets.bottom` to clear the bar.
 * - **Android** — `bottom: 0` already sits at the top edge of the tab bar
 *   (the bar is laid out below the content view), and `insets.bottom` is
 *   just the gesture/nav-bar inset. Adding the inset on top would push UI
 *   a tab-bar height too high; use `0` instead.
 */
export function useNativeTabBarInset(): number {
  const insets = useSafeAreaInsets();
  return Platform.OS === "ios" ? insets.bottom : 0;
}
