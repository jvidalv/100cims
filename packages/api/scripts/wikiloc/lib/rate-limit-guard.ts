/**
 * Tracks recent Wikiloc errors across the batch and, if 403s start clustering,
 * sleeps the run for ~15 minutes before allowing the next mountain to start.
 * Designed so a transient 403 burst (Wikiloc's WAF cooling us off) doesn't
 * waste hours of overnight time — we wait it out and resume.
 */

const RECENT_WINDOW_MS = 5 * 60_000; // 5 minutes
const TRIPWIRE_403_COUNT = 3;
const COOLDOWN_MS = 5 * 60_000; // 5 minutes (was 15) — aggressive retry
const MAX_COOLDOWNS_BEFORE_GIVE_UP = 3;

let recent403s: number[] = [];
let cooldownsSoFar = 0;

const isLikely403 = (error: Error): boolean => {
  const msg = error.message;
  return (
    msg.includes("403") ||
    msg.includes("Forbidden") ||
    // Cloudflare interstitial sometimes redirects to a challenge page; the
    // resulting `page.goto` returns 200 but the URL changed. We don't catch
    // that here — Wikiloc-specific HTML detection would be more reliable.
    msg.includes("blocked") ||
    msg.includes("captcha")
  );
};

const trimWindow = (now: number): void => {
  const cutoff = now - RECENT_WINDOW_MS;
  recent403s = recent403s.filter((t) => t > cutoff);
};

/**
 * Call after every mountain finishes — pass the error (if any). If the recent
 * 403 count crosses TRIPWIRE_403_COUNT we sleep for COOLDOWN_MS, then reset
 * the counter so the next mountain starts clean. Returns "abort" when we've
 * cooled down more than MAX_COOLDOWNS_BEFORE_GIVE_UP times — Wikiloc isn't
 * giving us an opening.
 */
export const noticeMountainOutcome = async (
  error: Error | null,
): Promise<"continue" | "abort"> => {
  if (!error || !isLikely403(error)) return "continue";

  const now = Date.now();
  recent403s.push(now);
  trimWindow(now);
  if (recent403s.length < TRIPWIRE_403_COUNT) return "continue";

  cooldownsSoFar += 1;
  if (cooldownsSoFar > MAX_COOLDOWNS_BEFORE_GIVE_UP) {
    console.error(
      `[guard] ${cooldownsSoFar} cooldowns exceeded — Wikiloc is hard-blocking us; aborting.`,
    );
    return "abort";
  }

  console.warn(
    `[guard] ${recent403s.length} 403/block(s) in last ${RECENT_WINDOW_MS / 60_000}min — sleeping ${COOLDOWN_MS / 60_000}min before resuming.`,
  );
  await new Promise((r) => setTimeout(r, COOLDOWN_MS));
  // Clear the window so post-cooldown counts start fresh.
  recent403s = [];
  return "continue";
};
