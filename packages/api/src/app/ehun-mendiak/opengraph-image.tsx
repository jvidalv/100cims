import { SITE_URL } from "@/lib/app-links";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og-card";

export const runtime = "edge";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Ehun Mendiak · 100 cumbres vasco-navarras";

export default function Image() {
  return renderOgCard({
    eyebrow: "Cims, sempre amunt",
    title: "Ehun Mendiak\n100 cumbres del centenario",
    backgroundUrl:
      "https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/gorbeia.jpg?date=1777985906239",
    logoUrl: `${SITE_URL}/assets/logo.png`,
  });
}
