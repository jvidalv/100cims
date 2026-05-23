import { Redirect } from "expo-router";

// /challenges is now a nested NativeTabs section (Official / Community).
// Existing links to "/challenges" land here and are redirected to the
// default tab so deep links from previous app builds keep working.
export default function ChallengesIndex() {
  return <Redirect href="/challenges/official" />;
}
