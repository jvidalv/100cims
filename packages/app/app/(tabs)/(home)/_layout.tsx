import { Stack } from "expo-router";

/**
 * Stack layout for the Home tab. Makes Latest summits (and any future Home
 * children) pushable onto this tab's internal stack so the native tab bar
 * stays visible during navigation. Without an explicit Stack here, expo-router
 * under NativeTabs doesn't push sibling routes onto the active tab — taps
 * silently no-op.
 */
export default function HomeLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
