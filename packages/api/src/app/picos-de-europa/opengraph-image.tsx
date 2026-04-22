import { SITE_URL } from "@/lib/app-links";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og-card";

export const runtime = "edge";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Picos de Europa · 71 cumbres";

export default function Image() {
  return renderOgCard({
    eyebrow: "Cims, sempre amunt",
    title: "Picos de Europa\n71 cumbres sobre 2.400 m",
    backgroundUrl:
      "https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/naranjo-de-bulnes.jpeg?date=1761896472107",
    logoUrl: `${SITE_URL}/assets/logo.png`,
  });
}
