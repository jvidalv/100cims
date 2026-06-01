import { getEnTranslator } from "./t";

export const WhatIs = () => {
  const t = getEnTranslator();
  return (
    <section className="py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold mb-6">
          {t("what-is-title")}
        </h2>
        <p className="text-lg text-muted-foreground mb-4 leading-relaxed">
          {t("what-is-p1")}
        </p>
        <p className="text-lg text-muted-foreground leading-relaxed">
          {t("what-is-p2")}
        </p>
      </div>
    </section>
  );
};
