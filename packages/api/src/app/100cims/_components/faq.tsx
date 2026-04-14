import { getCaTranslator } from "./t";

const FAQ_IDS = [1, 2, 3, 4, 5, 6, 7] as const;

export const Faq = () => {
  const t = getCaTranslator();
  const items = FAQ_IDS.map((i) => ({
    question: t(`faq-${i}-q`),
    answer: t(`faq-${i}-a`),
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: { "@type": "Answer", text: q.answer },
    })),
  };

  return (
    <section className="py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold mb-12 text-center">
          {t("faq-title")}
        </h2>
        <div className="space-y-6">
          {items.map((q) => (
            <div key={q.question} className="border-b pb-6">
              <h3 className="text-xl font-bold mb-2">{q.question}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {q.answer}
              </p>
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
