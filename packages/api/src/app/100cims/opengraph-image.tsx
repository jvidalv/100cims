import { SITE_URL } from "@/lib/app-links";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og-card";

export const runtime = "edge";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "100 Cims · Repte al mòbil";

export default function Image() {
  return renderOgCard({
    eyebrow: "Cims, sempre amunt",
    title: "100 Cims\nRepte al mòbil",
    backgroundUrl:
      "https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/pica-destats.jpg?date=1761896472107",
    logoUrl: `${SITE_URL}/assets/icon.png`,
  });
}
