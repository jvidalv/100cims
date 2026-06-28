/**
 * Validation for the optional link URLs we surface on a plan (WhatsApp group,
 * Wikiloc trail, Strava activity/route). We assert the *registrable domain*
 * (random hosts that just happen to share a word in the path are rejected)
 * and the URL scheme — Wikiloc additionally accepts its `wikiloc://` deep
 * link, which the iOS/Android apps register and which is how trail pages
 * are commonly shared.
 *
 * Each helper returns `null` for "valid", or a short error code. Empty /
 * undefined passes — these fields are all optional. The caller is expected
 * to call `normalizePlanLinkUrl` first to trim and reject blank strings.
 */

const WHATSAPP_HOSTS = ["whatsapp.com", "wa.me"];
// `loc.wiki` is Wikiloc's own short-link domain — its share sheet emits
// `https://loc.wiki/t/<id>?...` links, which is how trails are commonly
// shared, so it must be accepted alongside the canonical `wikiloc.com`.
const WIKILOC_HOSTS = ["wikiloc.com", "loc.wiki"];
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

// `host` matches `domain` if it IS the domain or ends with `.domain`. This
// is the "subdomains are fine, suffix-collisions aren't" rule (e.g. an
// attacker's `evilwhatsapp.com` does NOT match `whatsapp.com`).
const hostMatches = (host: string, domains: string[]) => {
  const lower = host.toLowerCase();
  return domains.some((d) => lower === d || lower.endsWith(`.${d}`));
};

const buildValidator =
  (domains: string[], protocols: readonly string[]) =>
  (raw: string | null | undefined): "INVALID_URL" | null => {
    if (raw === null || raw === undefined) return null;
    const trimmed = raw.trim();
    if (trimmed.length === 0) return null;
    const url = parseUrl(trimmed, protocols);
    if (!url) return "INVALID_URL";
    // wikiloc:// puts the host segment in `pathname`, not `hostname` — the
    // URL class only populates `hostname` for the "special" schemes
    // (http/https/ftp/…). Skip the host check for non-HTTP wikiloc deep
    // links; the protocol allowlist already constrains the origin.
    if (url.protocol === "https:" || url.protocol === "http:") {
      if (!hostMatches(url.hostname, domains)) return "INVALID_URL";
    }
    return null;
  };

export const validateWhatsappGroupUrl = buildValidator(
  WHATSAPP_HOSTS,
  HTTP_PROTOCOLS,
);
export const validateWikilocUrl = buildValidator(
  WIKILOC_HOSTS,
  WIKILOC_PROTOCOLS,
);
export const validateStravaUrl = buildValidator(STRAVA_HOSTS, HTTP_PROTOCOLS);

export type PlanLinkUrlField = "whatsappGroupUrl" | "wikilocUrl" | "stravaUrl";

/**
 * Run all three validators against a normalized triple and return the first
 * field that fails — or `null` when every field is valid. Routes use this
 * to surface a structured 400 ({ error: "INVALID_URL", field }) so the
 * mobile UI can pinpoint which input is wrong.
 */
export const findInvalidPlanLinkUrl = (input: {
  whatsappGroupUrl?: string | null;
  wikilocUrl?: string | null;
  stravaUrl?: string | null;
}): PlanLinkUrlField | null => {
  if (validateWhatsappGroupUrl(input.whatsappGroupUrl)) {
    return "whatsappGroupUrl";
  }
  if (validateWikilocUrl(input.wikilocUrl)) return "wikilocUrl";
  if (validateStravaUrl(input.stravaUrl)) return "stravaUrl";
  return null;
};

/**
 * Normalize empty/whitespace strings to null so the DB stores `NULL` rather
 * than `""` — keeps client-side rendering cheap (`url && <Link …>` works).
 */
export const normalizePlanLinkUrl = (
  raw: string | null | undefined,
): string | null => {
  if (raw === null || raw === undefined) return null;
  const trimmed = raw.trim();
  return trimmed.length === 0 ? null : trimmed;
};
