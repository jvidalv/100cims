import { SITE_URL } from "@/lib/app-links";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og-card";

export const runtime = "edge";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Scottish Munros · Track all 282";

export default function Image() {
  return renderOgCard({
    eyebrow: "Cims, sempre amunt",
    title: "Scottish Munros\nTrack all 282",
    backgroundUrl:
      "https://josepvidal-public-dev-bucket.s3.eu-west-3.amazonaws.com/100cims/mountain/profile/liathach-spidean-a-choire-leith.jpg",
    logoUrl: `${SITE_URL}/assets/logo.png`,
  });
}
