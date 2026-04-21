import type { AppLocale } from "@/api/lib/locale";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ANDROID_APP_URL, IOS_APP_URL } from "@/lib/app-links";

export interface SiteFooterStrings {
  tagline: string;
  rights: string;
  colApp: string;
  colAppHome: string;
  colAppChallenge: string;
  colAppThreePeaks: string;
  colAppScottishMunros: string;
  colAppPicosDeEuropa: string;
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

const FEATURED_CHALLENGES: { slug: string; label: string }[] = [
  { slug: "100-cims", label: "100 Cims" },
  { slug: "top-spain", label: "Top Spain" },
  { slug: "cumbres-astures", label: "Cumbres Astures" },
  { slug: "100-cims-usa", label: "100 Cims USA" },
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
                href="/100cims"
                className="text-muted-foreground hover:text-foreground"
              >
                {s.colAppChallenge}
              </a>
              <a
                href="/three-peaks"
                className="text-muted-foreground hover:text-foreground"
              >
                {s.colAppThreePeaks}
              </a>
              <a
                href="/scottish-munros"
                className="text-muted-foreground hover:text-foreground"
              >
                {s.colAppScottishMunros}
              </a>
              <a
                href="/picos-de-europa"
                className="text-muted-foreground hover:text-foreground"
              >
                {s.colAppPicosDeEuropa}
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
                  href={`/challenges/${c.slug}`}
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
