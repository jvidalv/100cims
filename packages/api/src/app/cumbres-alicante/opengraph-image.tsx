import { SITE_URL } from "@/lib/app-links";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og-card";

export const runtime = "edge";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Cumbres de Alicante · 11 cumbres icónicas";

export default function Image() {
  return renderOgCard({
    eyebrow: "Cims, sempre amunt",
    title: "Cumbres de Alicante\n11 cumbres icónicas",
    backgroundUrl:
      "https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/puig-campana.jpeg?date=1761896472107",
    logoUrl: `${SITE_URL}/assets/logo.png`,
  });
}
