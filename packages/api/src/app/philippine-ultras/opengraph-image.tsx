import { SITE_URL } from "@/lib/app-links";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og-card";

export const runtime = "edge";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Philippine Ultras · 29 ultra-prominent peaks";

export default function Image() {
  return renderOgCard({
    eyebrow: "Cims, sempre amunt",
    title: "Philippine Ultras\n29 ultra-prominent peaks",
    backgroundUrl:
      "https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/mayon.jpg?date=1779574800000",
    logoUrl: `${SITE_URL}/assets/logo.png`,
  });
}
