export const DEFAULT_CHALLENGE_ID = "5f996363-7460-4bc8-817c-8dd633c0b504";

export function resolveChallengeId(
  explicit: string | undefined | null,
  user: { activeChallengeId: string | null } | null,
): string {
  return explicit || user?.activeChallengeId || DEFAULT_CHALLENGE_ID;
}
