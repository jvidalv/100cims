const ALLOWED_PLATFORMS = new Set(["ios", "android", "web"]);
const VERSION_RE = /^\d+\.\d+\.\d+$/;

export const resolvePlatformFromRequest = (request: Request): string | null => {
  console.log(request.headers);
  const v = request.headers.get("x-app-platform")?.toLowerCase();
  return v && ALLOWED_PLATFORMS.has(v) ? v : null;
};

export const resolveAppVersionFromRequest = (
  request: Request,
): string | null => {
  const v = request.headers.get("x-app-version")?.trim();
  return v && VERSION_RE.test(v) ? v : null;
};
