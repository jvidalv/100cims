const DISCORD_CONTENT_LIMIT = 1900;
const REQUEST_TIMEOUT_MS = 5000;

export async function reportErrorToDiscord(params: {
  context: string;
  error: unknown;
}): Promise<boolean> {
  const url = process.env.EXPO_PUBLIC_DISCORD_ERROR_WEBHOOK;
  if (!url) return false;

  const message =
    params.error instanceof Error
      ? params.error.message
      : String(params.error);

  const rawContent = [
    `🚨 **App error** (${params.context})`,
    "```",
    `message: ${message}`,
    `time:    ${new Date().toISOString()}`,
    "```",
  ].join("\n");

  const content =
    rawContent.length > DISCORD_CONTENT_LIMIT
      ? rawContent.slice(0, DISCORD_CONTENT_LIMIT - 4) + "...\n```"
      : rawContent;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
      signal: controller.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}
