import * as Application from "expo-application";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Localization from "expo-localization";
import { Platform } from "react-native";

import { numberOrUndefined, stringOrUndefined } from "@/lib/type-guards";

const DISCORD_CONTENT_LIMIT = 1900;
const REQUEST_TIMEOUT_MS = 5000;
const STACK_LINES = 8;

type ErrorWithStatus = {
  message?: string;
  name?: string;
  stack?: string;
  status?: number;
  response?: { status?: number };
};

const getStatus = (err: ErrorWithStatus): number | undefined =>
  err.status ?? err.response?.status;

const classifyError = (err: ErrorWithStatus): { emoji: string; label: string } => {
  const status = getStatus(err);
  const message = err.message ?? "";

  if (/network request failed|fetch failed|offline|timeout/i.test(message)) {
    return {
      emoji: "🟡",
      label: "Likely transient — client network or API unreachable",
    };
  }
  if (status && status >= 500) {
    return { emoji: "🔴", label: `Server error (${status}) — actionable` };
  }
  if (status && status >= 400 && status !== 401 && status !== 403) {
    return { emoji: "🟠", label: `Client error (${status}) — likely actionable` };
  }
  return { emoji: "⚪", label: "Unclassified" };
};

const truncateStack = (stack: string | undefined): string | undefined => {
  if (!stack) return undefined;
  return stack.split("\n").slice(0, STACK_LINES).join("\n");
};

const toErrorWithStatus = (input: unknown): ErrorWithStatus => {
  if (!input || typeof input !== "object") {
    return { message: String(input) };
  }
  const out: ErrorWithStatus = {};
  if ("message" in input) out.message = stringOrUndefined(input.message);
  if ("name" in input) out.name = stringOrUndefined(input.name);
  if ("stack" in input) out.stack = stringOrUndefined(input.stack);
  if ("status" in input) out.status = numberOrUndefined(input.status);
  if (
    "response" in input &&
    input.response &&
    typeof input.response === "object" &&
    "status" in input.response
  ) {
    out.response = { status: numberOrUndefined(input.response.status) };
  }
  return out;
};

export async function reportErrorToDiscord(params: {
  context: string;
  error: unknown;
  userId?: string;
}): Promise<boolean> {
  const url = process.env.EXPO_PUBLIC_DISCORD_ERROR_WEBHOOK;
  if (!url) return false;

  const err: ErrorWithStatus = toErrorWithStatus(params.error);

  const verdict = classifyError(err);
  const status = getStatus(err);
  const stack = truncateStack(err.stack);

  const fields: { name: string; value: string; inline?: boolean }[] = [
    { name: "Verdict", value: `${verdict.emoji} ${verdict.label}` },
    { name: "Context", value: params.context, inline: true },
    {
      name: "Error",
      value:
        [err.name, err.message ?? String(params.error)]
          .filter(Boolean)
          .join(": ") || "(empty)",
    },
  ];

  if (status !== undefined) {
    fields.push({ name: "Status", value: String(status), inline: true });
  }
  if (params.userId) {
    fields.push({ name: "User", value: params.userId, inline: true });
  }
  fields.push(
    {
      name: "App",
      value: `${Application.nativeApplicationVersion ?? "?"} (build ${
        Application.nativeBuildVersion ?? "?"
      })`,
      inline: true,
    },
    {
      name: "Runtime",
      value: String(Constants.expoConfig?.runtimeVersion ?? "?"),
      inline: true,
    },
    {
      name: "Platform",
      value: `${Platform.OS} ${Platform.Version}`,
      inline: true,
    },
    {
      name: "Device",
      value: Device.modelName ?? "?",
      inline: true,
    },
    {
      name: "Locale",
      value: Localization.getLocales()[0]?.languageTag ?? "?",
      inline: true,
    },
  );

  if (stack) {
    const trimmed =
      stack.length > 900 ? stack.slice(0, 900) + "\n…(truncated)" : stack;
    fields.push({ name: "Stack", value: "```\n" + trimmed + "\n```" });
  }

  const embed = {
    title: `🚨 App error (${params.context})`,
    color: verdict.emoji === "🔴" ? 0xef4444 : verdict.emoji === "🟠" ? 0xf97316 : verdict.emoji === "🟡" ? 0xeab308 : 0x9ca3af,
    fields,
    timestamp: new Date().toISOString(),
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const body = JSON.stringify({ embeds: [embed] });
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body:
        body.length > DISCORD_CONTENT_LIMIT * 3
          ? JSON.stringify({
              embeds: [
                { ...embed, fields: fields.slice(0, 6) },
              ],
            })
          : body,
      signal: controller.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}
