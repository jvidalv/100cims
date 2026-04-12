interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

interface DiscordEmbed {
  title: string;
  color: number;
  fields: DiscordEmbedField[];
  timestamp?: string;
}

export const DISCORD_NEW_USER_WEBHOOK_URL =
  process.env.DISCORD_NEW_USER_WEBHOOK_URL;
export const DISCORD_ERRORS_WEBHOOK_URL =
  process.env.DISCORD_ERRORS_WEBHOOK_URL;
export const DISCORD_CONTACT_WEBHOOK_URL =
  process.env.DISCORD_CONTACT_WEBHOOK_URL;

export const sendDiscordEmbed = (
  webhookUrl: string | undefined,
  embed: DiscordEmbed,
) => {
  if (!webhookUrl) return;
  fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      embeds: [
        { ...embed, timestamp: embed.timestamp ?? new Date().toISOString() },
      ],
    }),
  }).catch((err) => {
    console.error("[Discord] webhook failed:", err);
  });
};

export const truncate = (value: string, max = 1000) =>
  value.length > max ? `${value.slice(0, max - 1)}…` : value;
