import { render } from "@react-email/render";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EMAIL_LOCALES, EMAIL_TEMPLATES, isEmailSlug } from "../_registry";
import type { WelcomeEmailLocale } from "../../../../../emails/welcome";

import { EmailPreviewClient } from "./_preview-client";

const isLocale = (s: string): s is WelcomeEmailLocale =>
  EMAIL_LOCALES.includes(s as WelcomeEmailLocale);

export default async function AdminEmailDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  if (!isEmailSlug(slug)) notFound();
  const template = EMAIL_TEMPLATES[slug];

  const sp = await searchParams;
  const localeParam = typeof sp.locale === "string" ? sp.locale : "en";
  const locale: WelcomeEmailLocale = isLocale(localeParam) ? localeParam : "en";

  const props: Record<string, string> = {};
  for (const [name, def] of Object.entries(template.fields)) {
    const v = sp[name];
    props[name] = typeof v === "string" ? v : def.default;
  }

  const html = await render(template.render(props, locale));

  return (
    <div className="p-8 space-y-4">
      <div className="space-y-1">
        <Link
          href="/admin/emails"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Emails
        </Link>
        <h1 className="text-2xl font-bold">{template.label}</h1>
        <p className="text-sm text-muted-foreground">{template.description}</p>
      </div>

      <EmailPreviewClient
        slug={slug}
        locale={locale}
        locales={EMAIL_LOCALES}
        fields={template.fields}
        propValues={props}
        html={html}
      />
    </div>
  );
}
