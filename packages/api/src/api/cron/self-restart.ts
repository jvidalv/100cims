import {
  DISCORD_COLOR,
  DISCORD_ERRORS_WEBHOOK_URL,
  sendDiscordEmbed,
} from "@/api/lib/discord";

const MIN_UPTIME_MS = 10 * 60 * 1000;
const MIN_RESTART_INTERVAL_MS = 60 * 60 * 1000;
let lastRestartAttemptMs = 0;

export const selfRestart = async (
  reason: string,
  { scheduled = false }: { scheduled?: boolean } = {},
): Promise<void> => {
  if (process.env.NODE_ENV !== "production") {
    console.log(`[self-restart] Skipped (non-production): ${reason}`);
    return;
  }

  const uptimeMs = process.uptime() * 1000;
  if (uptimeMs < MIN_UPTIME_MS) {
    console.log(
      `[self-restart] Skipped (uptime ${Math.round(uptimeMs / 1000)}s < ${MIN_UPTIME_MS / 1000}s): ${reason}`,
    );
    return;
  }

  if (!scheduled) {
    const now = Date.now();
    if (now - lastRestartAttemptMs < MIN_RESTART_INTERVAL_MS) {
      console.log(`[self-restart] Skipped (cooldown): ${reason}`);
      return;
    }
    lastRestartAttemptMs = now;
  }

  console.log(`[self-restart] Initiating restart: ${reason}`);

  const uptimeSec = Math.round(process.uptime());
  const heapMb = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
  sendDiscordEmbed(DISCORD_ERRORS_WEBHOOK_URL, {
    title: "Service Restarting",
    color: DISCORD_COLOR.BLURPLE,
    fields: [
      { name: "Reason", value: reason },
      {
        name: "Uptime",
        value: `${Math.floor(uptimeSec / 3600)}h ${Math.floor((uptimeSec % 3600) / 60)}m`,
        inline: true,
      },
      { name: "Heap", value: `${heapMb}MB`, inline: true },
    ],
  });

  await new Promise((resolve) => setTimeout(resolve, 1000));

  process.exit(1);
};

export const dailyRestart = (): Promise<void> =>
  selfRestart("Scheduled daily restart (2 AM UTC)", { scheduled: true });
