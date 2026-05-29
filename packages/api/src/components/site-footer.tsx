import type { AppLocale } from "@/api/lib/locale";
import { LanguageSwitcher } from "@/components/language-switcher";
import {
  ANDROID_APP_URL,
  INSTAGRAM_URL,
  IOS_APP_URL,
  TIKTOK_URL,
  WHATSAPP_COMMUNITY_URL,
  YOUTUBE_URL,
} from "@/lib/app-links";

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.57a8.16 8.16 0 0 0 4.77 1.52V6.69a4.85 4.85 0 0 1-1.84 0z" />
  </svg>
);

const YouTubeIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden
  >
    <path d="M21.58 7.19a2.51 2.51 0 0 0-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42A2.51 2.51 0 0 0 2.42 7.19 26.27 26.27 0 0 0 2 12a26.27 26.27 0 0 0 .42 4.81 2.51 2.51 0 0 0 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42a2.51 2.51 0 0 0 1.77-1.77A26.27 26.27 0 0 0 22 12a26.27 26.27 0 0 0-.42-4.81zM10 15V9l5.2 3-5.2 3z" />
  </svg>
);

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 32 32"
    fill="currentColor"
    aria-hidden
  >
    <path d="M16 3C8.82 3 3 8.82 3 16c0 2.29.6 4.53 1.74 6.5L3 29l6.66-1.74A12.94 12.94 0 0 0 16 29c7.18 0 13-5.82 13-13S23.18 3 16 3zm0 23.8c-1.97 0-3.9-.53-5.58-1.52l-.4-.24-3.95 1.03 1.05-3.85-.26-.41A10.76 10.76 0 0 1 5.2 16c0-5.95 4.85-10.8 10.8-10.8S26.8 10.05 26.8 16 21.95 26.8 16 26.8zm5.93-8.08c-.32-.16-1.92-.95-2.22-1.06-.3-.11-.52-.16-.73.16-.22.32-.84 1.06-1.03 1.28-.19.22-.38.24-.7.08-.32-.16-1.37-.5-2.6-1.61-.96-.86-1.61-1.91-1.8-2.23-.19-.32-.02-.5.14-.66.15-.14.32-.38.48-.56.16-.19.21-.32.32-.54.11-.22.05-.4-.03-.56-.08-.16-.73-1.76-1-2.4-.26-.63-.53-.55-.73-.56l-.62-.01c-.21 0-.56.08-.86.4-.3.32-1.13 1.1-1.13 2.69 0 1.58 1.16 3.11 1.32 3.33.16.21 2.28 3.49 5.53 4.89.77.33 1.38.53 1.85.68.78.25 1.48.21 2.04.13.62-.09 1.92-.78 2.19-1.54.27-.76.27-1.4.19-1.54-.08-.13-.29-.21-.61-.37z" />
  </svg>
);

export interface SiteFooterStrings {
  tagline: string;
  rights: string;
  colApp: string;
  colAppHome: string;
  colAppShop: string;
  colAppIos: string;
  colAppAndroid: string;
  colLegal: string;
  privacyPolicy: string;
  termsOfService: string;
  colContact: string;
  colContactHelp: string;
  madeBy: string;
  colChallenges: string;
  language: { label: string; en: string; ca: string; es: string };
}

// Bespoke landing pages get their own href; the rest fall through to
// the generic /challenges/[slug] template.
const FEATURED_CHALLENGES: { slug: string; label: string; href?: string }[] = [
  { slug: "100-cims", label: "100 Cims", href: "/100cims" },
  { slug: "national-three-peaks", label: "Three Peaks", href: "/three-peaks" },
  {
    slug: "scottish-munros",
    label: "Scottish Munros",
    href: "/scottish-munros",
  },
  {
    slug: "picos-de-europa",
    label: "Picos de Europa",
    href: "/picos-de-europa",
  },
  {
    slug: "picos-de-andalucia",
    label: "Picos de Andalucía",
    href: "/picos-de-andalucia",
  },
  {
    slug: "cumbres-alicante",
    label: "Cumbres de Alicante",
    href: "/cumbres-alicante",
  },
  { slug: "top-spain", label: "Top Spain" },
  { slug: "cumbres-astures", label: "Cumbres Astures" },
  { slug: "100-cims-usa", label: "100 Cims USA" },
  { slug: "ehun-mendiak", label: "Ehun Mendiak", href: "/ehun-mendiak" },
  {
    slug: "sostres-comarcals",
    label: "Sostres Comarcals",
    href: "/sostres-comarcals",
  },
  {
    slug: "philippine-ultras",
    label: "Philippine Ultras",
    href: "/philippine-ultras",
  },
  {
    slug: "techos-provinciales",
    label: "Techos Provinciales",
    href: "/techos-provinciales",
  },
];

interface Props {
  strings: SiteFooterStrings;
  /** When set, locale-prefixes the home and shop links (otherwise middleware redirects from /). */
  locale?: AppLocale;
}

export const SiteFooter = ({ strings: s, locale }: Props) => {
  const year = new Date().getFullYear();
  const homeHref = locale ? `/${locale}` : "/";
  const shopHref = locale ? `/${locale}/shop` : "/shop";
  const contactHref = locale ? `/${locale}/contact` : "/contact";

  return (
    <footer className="border-t border-border/50 py-12 mt-8">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-5">
          <div className="col-span-2 sm:col-span-1 flex flex-col gap-3">
            <a
              href={homeHref}
              className="flex items-center gap-2 text-xl font-bold"
            >
              <img
                src="/assets/logo.png"
                alt="Cims, sempre amunt"
                width={62}
                height={62}
                className="rounded-lg"
              />
            </a>
            <p className="text-sm text-muted-foreground">{s.tagline}</p>
            {locale ? (
              <div className="my-2">
                <LanguageSwitcher current={locale} strings={s.language} />
              </div>
            ) : null}
            <p className="text-xs text-muted-foreground">
              © {year} · {s.rights}
            </p>
          </div>

          <div>
            <h4 className="mb-3 font-semibold">{s.colApp}</h4>
            <div className="grid gap-2 text-sm">
              <a
                href={homeHref}
                className="text-muted-foreground hover:text-foreground"
              >
                {s.colAppHome}
              </a>
              <a
                href={shopHref}
                className="text-muted-foreground hover:text-foreground"
              >
                {s.colAppShop}
              </a>
              <a
                href={IOS_APP_URL}
                target="_blank"
                rel="noopener"
                className="text-muted-foreground hover:text-foreground"
              >
                {s.colAppIos}
              </a>
              <a
                href={ANDROID_APP_URL}
                target="_blank"
                rel="noopener"
                className="text-muted-foreground hover:text-foreground"
              >
                {s.colAppAndroid}
              </a>
            </div>
          </div>

          <div>
            <h4 className="mb-3 font-semibold">{s.colChallenges}</h4>
            <div className="grid gap-2 text-sm">
              {FEATURED_CHALLENGES.map((c) => (
                <a
                  key={c.slug}
                  href={c.href ?? `/challenges/${c.slug}`}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {c.label}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-3 font-semibold">{s.colLegal}</h4>
            <div className="grid gap-2 text-sm">
              <a
                href="/privacy-policy"
                className="text-muted-foreground hover:text-foreground"
              >
                {s.privacyPolicy}
              </a>
              <a
                href="/terms-of-service"
                className="text-muted-foreground hover:text-foreground"
              >
                {s.termsOfService}
              </a>
            </div>
          </div>

          <div>
            <h4 className="mb-3 font-semibold">{s.colContact}</h4>
            <div className="grid gap-2 text-sm">
              <a
                href={contactHref}
                className="text-muted-foreground hover:text-foreground"
              >
                {s.colContactHelp}
              </a>
              <div className="flex items-center gap-3 py-1">
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener"
                  aria-label="Instagram"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <InstagramIcon className="size-5" />
                </a>
                <a
                  href={TIKTOK_URL}
                  target="_blank"
                  rel="noopener"
                  aria-label="TikTok"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <TikTokIcon className="size-5" />
                </a>
                <a
                  href={YOUTUBE_URL}
                  target="_blank"
                  rel="noopener"
                  aria-label="YouTube"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <YouTubeIcon className="size-5" />
                </a>
                <a
                  href={WHATSAPP_COMMUNITY_URL}
                  target="_blank"
                  rel="noopener"
                  aria-label="WhatsApp"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <WhatsAppIcon className="size-5" />
                </a>
              </div>
              <p className="text-muted-foreground">
                {s.madeBy}{" "}
                <a
                  href="https://josepvidal.dev"
                  target="_blank"
                  rel="noopener"
                  className="hover:text-foreground hover:underline"
                >
                  Josep Vidal
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
