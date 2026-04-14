import type {
  ChallengeFaqItem,
  ChallengeLocale,
} from "@/app/challenges/content/schema";
import { getChallengeTemplateTranslator } from "@/lib/locale-dictionaries";

interface Props {
  locale: ChallengeLocale;
  items: ChallengeFaqItem[];
}

export const ChallengeFaq = ({ locale, items }: Props) => {
  const t = getChallengeTemplateTranslator(locale);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  };

  return (
    <section className="py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold mb-12 text-center">
          {t("faq-title")}
        </h2>
        <div className="space-y-6">
          {items.map((it) => (
            <div key={it.q} className="border-b pb-6">
              <h3 className="text-xl font-bold mb-2">{it.q}</h3>
              <p className="text-muted-foreground leading-relaxed">{it.a}</p>
            </div>
          ))}
        </div>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </section>
  );
};
