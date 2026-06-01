import type { IntlShape } from "react-intl";

/**
 * Mirror of the server-side validator in
 * `packages/api/src/api/lib/plan-link-urls.ts`. Lives in the mobile package
 * so forms can show inline errors before submit; the server stays
 * authoritative (it's the only thing that ever sees the value, and old
 * mobile builds without this check still get a 400 on bad input).
 *
 * Keep this in lockstep with the server: same host suffix-match rule, same
 * protocol allowlist (Wikiloc accepts its `wikiloc://` deep link in
 * addition to https).
 */

const WHATSAPP_HOSTS = ["whatsapp.com", "wa.me"];
const WIKILOC_HOSTS = ["wikiloc.com"];
const STRAVA_HOSTS = ["strava.com", "strava.app.link"];

const HTTP_PROTOCOLS = ["http:", "https:"] as const;
const WIKILOC_PROTOCOLS = ["http:", "https:", "wikiloc:"] as const;

const parseUrl = (raw: string, protocols: readonly string[]): URL | null => {
  try {
    const u = new URL(raw);
    if (!protocols.includes(u.protocol)) return null;
    return u;
  } catch {
    return null;
  }
};

const hostMatches = (host: string, domains: string[]) => {
  const lower = host.toLowerCase();
  return domains.some((d) => lower === d || lower.endsWith(`.${d}`));
};

const buildValidator =
  (domains: string[], protocols: readonly string[]) =>
  (raw: string | null | undefined): boolean => {
    if (raw === null || raw === undefined) return true;
    const trimmed = raw.trim();
    if (trimmed.length === 0) return true;
    const url = parseUrl(trimmed, protocols);
    if (!url) return false;
    if (url.protocol === "https:" || url.protocol === "http:") {
      return hostMatches(url.hostname, domains);
    }
    return true;
  };

export const isValidWhatsappGroupUrl = buildValidator(
  WHATSAPP_HOSTS,
  HTTP_PROTOCOLS,
);
export const isValidWikilocUrl = buildValidator(
  WIKILOC_HOSTS,
  WIKILOC_PROTOCOLS,
);
export const isValidStravaUrl = buildValidator(STRAVA_HOSTS, HTTP_PROTOCOLS);

type PlanLinkUrlField = "whatsappGroupUrl" | "wikilocUrl" | "stravaUrl";

/**
 * Server returns `{ error: "INVALID_URL", field }` on a 400 from plan
 * create/update when one of the link URLs fails validation. Type-guard
 * for that shape so callers can show a field-aware message.
 */
export const isInvalidUrlError = (
  e: unknown,
): e is { error: "INVALID_URL"; field: PlanLinkUrlField } => {
  if (!e || typeof e !== "object") return false;
  if (!("error" in e) || e.error !== "INVALID_URL") return false;
  if (!("field" in e)) return false;
  return (
    e.field === "whatsappGroupUrl" ||
    e.field === "wikilocUrl" ||
    e.field === "stravaUrl"
  );
};

export const invalidUrlMessage = (
  field: PlanLinkUrlField,
  intl: IntlShape,
): string => {
  if (field === "whatsappGroupUrl") {
    return intl.formatMessage({
      defaultMessage:
        "The WhatsApp group link doesn't look right. Must point to chat.whatsapp.com or wa.me.",
    });
  }
  if (field === "wikilocUrl") {
    return intl.formatMessage({
      defaultMessage:
        "The Wikiloc link doesn't look right. Must point to wikiloc.com.",
    });
  }
  return intl.formatMessage({
    defaultMessage:
      "The Strava link doesn't look right. Must point to strava.com.",
  });
};
