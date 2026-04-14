import geoip from "geoip-lite";

const PRIVATE_PREFIXES = ["10.", "192.168.", "127.", "172.16.", "::1"];

const normalizeIp = (raw: string): string => {
  const trimmed = raw.trim();
  // ::ffff:1.2.3.4 → 1.2.3.4 (IPv4-mapped IPv6 form that geoip-lite can't resolve)
  return trimmed.startsWith("::ffff:") ? trimmed.slice(7) : trimmed;
};

const isPrivate = (ip: string) =>
  PRIVATE_PREFIXES.some((p) => ip.startsWith(p));

export const resolveCountryFromRequest = (request: Request): string | null => {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfIp = request.headers.get("cf-connecting-ip");

  const raw =
    forwarded?.split(",")[0]?.trim() || realIp?.trim() || cfIp?.trim() || "";
  if (!raw) return null;

  const ip = normalizeIp(raw);
  if (isPrivate(ip)) return null;

  const lookup = geoip.lookup(ip);
  return lookup?.country ?? null;
};
