import { SITE_URL } from "@/lib/app-links";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og-card";

export const runtime = "edge";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "National Three Peaks Challenge";

export default function Image() {
  return renderOgCard({
    eyebrow: "Cims, sempre amunt",
    title: "National Three Peaks\nBen Nevis · Scafell Pike · Snowdon",
    backgroundUrl:
      "https://josepvidal-public-dev-bucket.s3.eu-west-3.amazonaws.com/100cims/mountain/profile/ben-nevis.jpg",
    logoUrl: `${SITE_URL}/assets/logo.png`,
  });
}
