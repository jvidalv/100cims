import { getPublicStats } from "@/api/lib/public-stats";

import { getEnTranslator } from "./t";

const formatNumber = (n: number) => new Intl.NumberFormat("en-US").format(n);

export const Stats = async () => {
  const t = getEnTranslator();
  const stats = await getPublicStats();

  const cards = [
    { value: stats.totalSummits, label: t("stats-summits") },
    { value: stats.totalUsers, label: t("stats-users") },
    { value: stats.essentialMountainCount, label: t("stats-essentials") },
    { value: stats.totalMountains, label: t("stats-mountains") },
  ];

  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
          {t("stats-title")}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {cards.map((c) => (
            <div
              key={c.label}
              className="p-6 rounded-xl bg-background border text-center"
            >
              <div className="text-3xl sm:text-4xl font-black text-primary mb-2">
                {formatNumber(c.value)}
              </div>
              <div className="text-sm text-muted-foreground">{c.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
