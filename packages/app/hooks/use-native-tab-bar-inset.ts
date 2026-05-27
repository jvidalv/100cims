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
 *
 * Outside the NativeTabs subtree (rendered at the app root), neither
 * platform's mechanism applies — pass `{ atRoot: true }` and the caller
 * adds the NativeTabs bar height manually with `NATIVE_TAB_BAR_HEIGHT`.
 */
export function useNativeTabBarInset(): number {
  const insets = useSafeAreaInsets();
  return Platform.OS === "ios" ? insets.bottom : 0;
}

// iOS UITabBar (49pt) / Android Material bottom nav (~56dp). For UI rendered
// at the app root, outside the NativeTabs subtree — combine with
// `useSafeAreaInsets().bottom` and this constant manually. See
// `floating-cart-button.tsx` for the canonical pattern.
export const NATIVE_TAB_BAR_HEIGHT = Platform.OS === "ios" ? 49 : 56;
