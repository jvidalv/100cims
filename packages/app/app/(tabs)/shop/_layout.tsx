import { Stack } from "expo-router";

/**
 * Stack layout for the Shop tab. Makes product detail (`[slug].tsx`) and
 * cart (`cart.tsx`) pushable onto this tab's internal stack so the main
 * tab bar stays visible during navigation.
 *
 * Without an explicit Stack here, expo-router under NativeTabs doesn't
 * push sibling routes onto the active tab when the inner screen isn't
 * already a Stack-rooted component — taps on `<Link href="/shop/[slug]">`
 * silently no-op. Same fix pattern as `app/(tabs)/(home)/_layout.tsx`
 * (see SKILL.md NativeTabs gotchas).
 */
export default function ShopLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
