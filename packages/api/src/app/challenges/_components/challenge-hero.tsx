import { AppleIcon, PlayStoreIcon } from "@/components/store-icons";
import { Button } from "@/components/ui/button";
import { ANDROID_APP_URL, IOS_APP_URL } from "@/lib/app-links";

interface Props {
  name: string;
  emoji: string | null;
  tagline: string;
  imageUrl: string;
}

export const ChallengeHero = ({ name, emoji, tagline, imageUrl }: Props) => (
  <section className="relative overflow-hidden">
    <img
      src={imageUrl}
      alt=""
      aria-hidden
      fetchPriority="high"
      className="absolute inset-0 w-full h-full object-cover"
    />
    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/55 to-black/80" />
    <div className="relative flex flex-col items-center justify-center py-24 sm:py-32 px-4 text-white">
      {emoji ? (
        <div className="text-6xl mb-4" aria-hidden>
          {emoji}
        </div>
      ) : null}
      <h1 className="text-4xl sm:text-6xl text-center font-black mb-4">
        {name}
      </h1>
      <p className="text-xl text-center mb-8 max-w-2xl">{tagline}</p>
      <div className="flex flex-col sm:flex-row gap-3">
        <a href={IOS_APP_URL} target="_blank" rel="noopener">
          <Button size="lg" className="font-bold gap-2">
            <AppleIcon />
            App Store
          </Button>
        </a>
        <a href={ANDROID_APP_URL} target="_blank" rel="noopener">
          <Button
            size="lg"
            variant="outline"
            className="font-bold gap-2 bg-white/10 text-white border-white/40 hover:bg-white/20 hover:text-white"
          >
            <PlayStoreIcon />
            Google Play
          </Button>
        </a>
      </div>
    </div>
  </section>
);
