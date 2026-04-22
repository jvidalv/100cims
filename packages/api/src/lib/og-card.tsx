import { ImageResponse } from "next/og";

// Facebook's recommended OG size. Twitter accepts 2:1 but 1.91:1 works for both.
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

interface OgCardInput {
  /** Title shown in big text, bottom-left. Line-break with \n. */
  title: string;
  /** Small "eyebrow" text above the title — e.g. "CIMS, SEMPRE AMUNT". */
  eyebrow?: string;
  /** Absolute URL of the mountain background photo. */
  backgroundUrl: string;
  /** Absolute URL of the logo (public/assets/logo.png). */
  logoUrl: string;
}

// Dynamic OG card: full-bleed mountain photo + dark gradient + title + logo.
// Used by every landing page's opengraph-image.tsx route.
export const renderOgCard = ({
  title,
  eyebrow,
  backgroundUrl,
  logoUrl,
}: OgCardInput): ImageResponse =>
  new ImageResponse(
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        fontFamily: "system-ui, sans-serif",
        color: "white",
      }}
    >
      {/* Background photo */}
      <img
        src={backgroundUrl}
        alt=""
        width={OG_SIZE.width}
        height={OG_SIZE.height}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
      {/* Gradient overlay — dark in bottom-left where the title sits */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(135deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 45%, rgba(0,0,0,0.2) 100%)",
        }}
      />
      {/* Logo + wordmark, top-right */}
      <div
        style={{
          position: "absolute",
          top: 44,
          right: 56,
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <img
          src={logoUrl}
          alt="Cims, sempre amunt"
          width={64}
          height={64}
          style={{ borderRadius: 12 }}
        />
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>
          fescims.com
        </div>
      </div>
      {/* Title block, bottom-left */}
      <div
        style={{
          position: "absolute",
          left: 56,
          bottom: 56,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          maxWidth: 900,
        }}
      >
        {eyebrow ? (
          <div
            style={{
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: 4,
              textTransform: "uppercase",
              opacity: 0.85,
            }}
          >
            {eyebrow}
          </div>
        ) : null}
        <div
          style={{
            fontSize: 76,
            fontWeight: 900,
            lineHeight: 1.05,
            letterSpacing: -1.5,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {title.split("\n").map((line, i) => (
            <span key={i}>{line}</span>
          ))}
        </div>
      </div>
    </div>,
    OG_SIZE,
  );
