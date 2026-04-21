import { getFeaturedPeaksForChallengeSlug } from "@/lib/challenge-helpers";

import { getEnTranslator } from "./t";

const CHALLENGE_SLUG = "national-three-peaks";
const PEAK_COUNT = 3;

export const FeaturedPeaks = async () => {
  const t = getEnTranslator();
  const peaks = await getFeaturedPeaksForChallengeSlug(
    CHALLENGE_SLUG,
    PEAK_COUNT,
  );

  if (!peaks.length) return null;

  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-3">
          {t("featured-title")}
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          {t("featured-subtitle")}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {peaks.map((p) => (
            <article
              key={p.id}
              className="rounded-xl overflow-hidden border bg-background"
            >
              {p.imageUrl ? (
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  loading="lazy"
                  width={400}
                  height={300}
                  className="w-full aspect-[4/3] object-cover"
                />
              ) : (
                <div className="w-full aspect-[4/3] bg-muted" />
              )}
              <div className="p-4">
                <h3 className="font-bold mb-1">{p.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {p.location} · {Math.round(Number(p.height))} m
                </p>
              </div>
            </article>
          ))}
        </div>
        <p className="mt-8 text-center text-xs text-muted-foreground leading-relaxed">
          Photos:{" "}
          <a
            href="https://commons.wikimedia.org/wiki/File:BenNevis2005.jpg"
            target="_blank"
            rel="noopener"
            className="underline"
          >
            Ben Nevis
          </a>{" "}
          by Thincat (public domain) ·{" "}
          <a
            href="https://commons.wikimedia.org/wiki/File:Scafell_massif.jpg"
            target="_blank"
            rel="noopener"
            className="underline"
          >
            Scafell Pike
          </a>{" "}
          by Doug Sim,{" "}
          <a
            href="https://creativecommons.org/licenses/by-sa/4.0"
            target="_blank"
            rel="noopener"
            className="underline"
          >
            CC BY-SA 4.0
          </a>{" "}
          ·{" "}
          <a
            href="https://commons.wikimedia.org/wiki/File:Snowdon_massif.jpg"
            target="_blank"
            rel="noopener"
            className="underline"
          >
            Yr Wyddfa
          </a>{" "}
          by Stemonitis,{" "}
          <a
            href="https://creativecommons.org/licenses/by-sa/3.0"
            target="_blank"
            rel="noopener"
            className="underline"
          >
            CC BY-SA 3.0
          </a>{" "}
          · via Wikimedia Commons.
        </p>
      </div>
    </section>
  );
};
