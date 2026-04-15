import createMiddleware from "next-intl/middleware";

import { routing } from "@/i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: [
    "/((?!api|admin|_next|_vercel|100cims|challenges|deeplink|contact|privacy-policy|terms-of-service|login|sitemap.xml|robots.txt|favicon|.*\\..*).*)",
  ],
};
