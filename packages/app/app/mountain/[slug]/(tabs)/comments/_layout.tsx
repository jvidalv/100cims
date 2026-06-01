import { Stack } from "expo-router";

/**
 * Stack inside the Comments tab so the composer (`comments/new`) pushes
 * onto the tab's own stack — the bottom NativeTabs bar stays visible while
 * the user is writing. Tapping the Comments tab pops back to the list.
 *
 * Header is hidden because each screen renders its own BlurredScreenHeader.
 */
export default function CommentsStackLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
