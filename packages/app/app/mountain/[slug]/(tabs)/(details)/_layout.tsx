import { Stack } from "expo-router";

/**
 * Stack layout for the mountain Details tab. Makes the All-summits screen
 * (and any future Details children) pushable onto this tab's internal
 * stack so the mountain tab bar (Details / Summit / Comments) stays
 * visible during navigation — same pattern as `app/(tabs)/(home)/_layout`.
 */
export default function MountainDetailsLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
