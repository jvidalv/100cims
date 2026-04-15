import { eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { db } from "@/db";
import { userTable } from "@/db/schema";
import {
  signEmailToken,
  verifyEmailToken,
  type EmailTokenClaims,
} from "@/api/lib/email-tokens";
import { SITE_URL } from "@/lib/app-links";

import { ResubscribeButton } from "./_resubscribe-button";

type Locale = "en" | "ca" | "es";
const isLocale = (v: string | undefined): v is Locale =>
  v === "en" || v === "ca" || v === "es";

const resolveLocale = async (
  langParam: string | undefined,
  claims: EmailTokenClaims | null,
): Promise<Locale> => {
  if (isLocale(langParam)) return langParam;
  if (claims) {
    const [u] = await db
      .select({ locale: userTable.locale })
      .from(userTable)
      .where(eq(userTable.id, claims.userId));
    const short = u?.locale?.trim().toLowerCase().split(/[-_]/)[0];
    if (isLocale(short)) return short;
  }
  return "en";
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const tokenParam = typeof sp.token === "string" ? sp.token : undefined;
  const langParam = typeof sp.lang === "string" ? sp.lang : undefined;

  const claims = tokenParam ? await verifyEmailToken(tokenParam) : null;
  const isUnsubscribeToken = !!claims && claims.purpose === "unsubscribe";

  const locale = await resolveLocale(langParam, claims);
  const t = await getTranslations({ locale, namespace: "unsubscribe-page" });

  // Idempotent: if the token is valid, flip the flag during render. Re-clicks
  // are no-ops. Email clients that prefetch the URL will trigger this on the
  // first load — that's the desired one-click UX.
  if (isUnsubscribeToken && claims) {
    await db
      .update(userTable)
      .set({ emailNotificationsEnabled: false, updatedAt: new Date() })
      .where(eq(userTable.id, claims.userId));
  }

  // Mint a fresh resubscribe token so the "Resubscribe" button can flip it
  // back. Requires a valid unsubscribe-purpose token to start with — otherwise
  // we render the error state.
  const resubscribeToken =
    isUnsubscribeToken && claims
      ? await signEmailToken(claims.userId, "resubscribe")
      : null;

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16 text-slate-900">
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        {!isUnsubscribeToken ? (
          <>
            <h1 className="mb-3 text-2xl font-bold">{t("error-title")}</h1>
            <p className="text-slate-700">{t("error-body")}</p>
            <div className="mt-8">
              <Link
                href={SITE_URL}
                className="text-sm font-medium text-slate-700 underline"
              >
                {t("back-to-app")}
              </Link>
            </div>
          </>
        ) : (
          <>
            <h1 className="mb-3 text-2xl font-bold">{t("title")}</h1>
            <p className="text-slate-700">{t("body")}</p>
            {resubscribeToken && (
              <div className="mt-6">
                <ResubscribeButton
                  token={resubscribeToken}
                  ctaLabel={t("resubscribe-cta")}
                  pendingLabel={t("resubscribe-pending")}
                  successTitle={t("resubscribed-title")}
                  successBody={t("resubscribed-body")}
                />
              </div>
            )}
            <div className="mt-8">
              <Link
                href={SITE_URL}
                className="text-sm font-medium text-slate-700 underline"
              >
                {t("back-to-app")}
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
