import { Stack } from "expo-router";

// Stack layout so [routeId] pushes onto the Routes tab keeping the mountain
// tab bar visible — mirrors comments/_layout.tsx.
export default function MountainRoutesLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
