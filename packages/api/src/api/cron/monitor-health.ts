import { selfRestart } from "@/api/cron/self-restart";
import {
  DISCORD_COLOR,
  DISCORD_ERRORS_WEBHOOK_URL,
  sendDiscordEmbed,
} from "@/api/lib/discord";
import { runHealthCheck } from "@/api/lib/health";

const RESTART_TRIGGERS = new Set(["heap", "rss"]);

const COOLDOWN_MS = 30 * 60 * 1000;
const lastAlerted = new Map<string, number>();

const shouldAlert = (key: string): boolean => {
  const last = lastAlerted.get(key);
  if (last && Date.now() - last < COOLDOWN_MS) return false;
  lastAlerted.set(key, Date.now());
  return true;
};

export const monitorHealth = async (): Promise<void> => {
  if (process.env.NODE_ENV !== "production") return;

  const snapshot = await runHealthCheck();
  if (snapshot.status === "healthy") return;

  const failing = snapshot.checks.filter((c) => c.status !== "healthy");
  const alertKey = failing
    .map((c) => `${c.name}:${c.status}`)
    .sort()
    .join("|");
  if (!shouldAlert(alertKey)) return;

  const isCritical = snapshot.status === "critical";
  sendDiscordEmbed(DISCORD_ERRORS_WEBHOOK_URL, {
    title: isCritical ? "Health: CRITICAL" : "Health: warning",
    color: isCritical ? DISCORD_COLOR.RED : DISCORD_COLOR.YELLOW,
    fields: failing.map((c) => ({
      name: `${c.name} [${c.status}]`,
      value: c.message,
      inline: true,
    })),
  });

  const restartCheck = failing.find(
    (c) => c.status === "critical" && RESTART_TRIGGERS.has(c.name),
  );
  if (restartCheck) {
    void selfRestart(`${restartCheck.name} critical: ${restartCheck.message}`);
  }
};
