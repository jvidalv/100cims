import geoip from "geoip-lite";

export const resolveCountryFromRequest = (request: Request): string | null => {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = (forwarded?.split(",")[0] ?? "").trim();
  if (!ip) return null;
  const lookup = geoip.lookup(ip);
  return lookup?.country ?? null;
};
