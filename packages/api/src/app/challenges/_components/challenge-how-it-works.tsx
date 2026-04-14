import type { ChallengeLocale } from "@/app/challenges/content/schema";
import { getChallengeTemplateTranslator } from "@/lib/locale-dictionaries";

interface Props {
  locale: ChallengeLocale;
}

export const ChallengeHowItWorks = ({ locale }: Props) => {
  const t = getChallengeTemplateTranslator(locale);
  const steps = [
    { title: t("step-1-title"), body: t("step-1-body") },
    { title: t("step-2-title"), body: t("step-2-body") },
    { title: t("step-3-title"), body: t("step-3-body") },
  ];

  return (
    <section className="py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
          {t("how-it-works-title")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((s) => (
            <div key={s.title} className="p-6 rounded-xl bg-background border">
              <h3 className="text-xl font-bold mb-3">{s.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
