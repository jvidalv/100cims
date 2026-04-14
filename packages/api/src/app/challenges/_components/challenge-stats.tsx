import type { ChallengeLocale } from "@/app/challenges/content/schema";
import { getChallengeTemplateTranslator } from "@/lib/locale-dictionaries";

interface Props {
  locale: ChallengeLocale;
  summitCount: number;
  mountainCount: number;
}

const LOCALE_FORMAT: Record<ChallengeLocale, string> = {
  ca: "ca-ES",
  es: "es-ES",
  en: "en-US",
};

export const ChallengeStats = ({
  locale,
  summitCount,
  mountainCount,
}: Props) => {
  const t = getChallengeTemplateTranslator(locale);
  const format = (n: number) =>
    new Intl.NumberFormat(LOCALE_FORMAT[locale]).format(n);

  const cards = [
    { value: summitCount, label: t("stats-summits") },
    { value: mountainCount, label: t("stats-mountains") },
  ];

  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
          {t("stats-title")}
        </h2>
        <div className="grid grid-cols-2 gap-6">
          {cards.map((c) => (
            <div
              key={c.label}
              className="p-6 rounded-xl bg-background border text-center"
            >
              <div className="text-3xl sm:text-4xl font-black text-primary mb-2">
                {format(c.value)}
              </div>
              <div className="text-sm text-muted-foreground">{c.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
