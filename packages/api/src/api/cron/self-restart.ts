const MIN_UPTIME_MS = 10 * 60 * 1000;

export async function dailyRestart(): Promise<void> {
  const uptimeMs = process.uptime() * 1000;
  if (uptimeMs < MIN_UPTIME_MS) {
    console.log(
      `[self-restart] Skipped (uptime ${Math.round(uptimeMs / 1000)}s < ${MIN_UPTIME_MS / 1000}s minimum)`,
    );
    return;
  }

  console.log("[self-restart] Initiating scheduled daily restart (2 AM)");
  await new Promise((resolve) => setTimeout(resolve, 500));
  process.exit(1);
}
