import type { AppLocale } from "@/api/lib/locale";
import { LanguageSwitcher } from "@/components/language-switcher";
import {
  ANDROID_APP_URL,
  INSTAGRAM_URL,
  IOS_APP_URL,
  TIKTOK_URL,
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
