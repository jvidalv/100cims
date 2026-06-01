import { Redirect } from "expo-router";

import { ChallengeList } from "@/components/challenge/challenge-list";
import { useAuth } from "@/components/providers/auth-provider";

// Community challenges require an account — the original single-screen
// version pushed /join when the user tapped the Community tab while
// unauthenticated; keep that gate, just enforced at the screen level.
export default function CommunityChallengesScreen() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Redirect href="/join" />;
  }
  return <ChallengeList variant="community" />;
}
