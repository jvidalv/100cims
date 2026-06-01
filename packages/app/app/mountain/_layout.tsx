import { Stack } from "expo-router";
import { Platform } from "react-native";

/**
 * Parent Stack for the /mountain subtree.
 *
 * Owning a dedicated Stack here scopes mountain navigation to its own
 * frame: back unwinds one mountain at a time, and pop-then-push handoff
 * inside `MountainRowMinimal` (the "tap a different mountain from inside
 * a mountain detail" path) doesn't have to reach into the root Stack to
 * release the previous mountain's NativeTabs.
 *
 * Why pop-then-push and not a stock `<Link>`? `NativeTabs` reads its
 * trigger mapping from the route NODE'S local params, not the live URL.
 * Pushing /mountain/A → /mountain/B leaves A's route node alive in the
 * native view hierarchy with its NativeTabs still listening for tab taps,
 * and the previous bar wins — tapping "Details" pops you back to A. The
 * cleanest hack is to pop A before pushing B; see the navigation logic in
 * `components/ui/molecules/mountain-row-minimal.tsx`.
 *
 * `mountain/[slug]/` has no index file. Its children are `[slug]/edit`
 * and `[slug]/(tabs)`, which expo-router flattens to those leaf names —
 * the Stack screen declarations match the leaves, not `[slug]` itself.
 */
export default function MountainLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        // Mirror the root Stack's Android-only freeze workaround: the
        // default `freezeOnBlur` snapshots the outgoing screen as a Bitmap
        // for the slide transition, and that bitmap gets `.recycle()`'d
        // before the pop animation finishes on Android — crashing with
        // `Canvas: trying to use a recycled bitmap`. Disabling freeze on
        // Android sidesteps the snapshot path. See app/_layout.tsx for
        // the same workaround at the root level.
        freezeOnBlur: Platform.OS === "android" ? false : undefined,
      }}
    >
      <Stack.Screen name="[slug]/(tabs)" />
      <Stack.Screen name="[slug]/edit" />
    </Stack>
  );
}
