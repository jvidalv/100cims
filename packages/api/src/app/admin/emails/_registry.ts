import { ReengageColdEmail } from "../../../../emails/reengage-cold";
import { ReengageSummerEmail } from "../../../../emails/reengage-summer";
import {
  WelcomeEmail,
  type WelcomeEmailLocale,
} from "../../../../emails/welcome";

import type { CampaignSlug } from "@/api/lib/campaigns";

export const EMAIL_LOCALES: WelcomeEmailLocale[] = ["en", "ca", "es"];

type FieldDef =
  | { type: "text"; default: string }
  | { type: "select"; default: string; options: readonly string[] };

export type EmailTemplate = {
  label: string;
  description: string;
  trigger: string;
  fields: Record<string, FieldDef>;
  // unsubscribeUrl defaults to a preview placeholder; the admin test-send
  // route passes a real signed token so the link in the test email works.
  render: (
    props: Record<string, string>,
    locale: WelcomeEmailLocale,
    unsubscribeUrl?: string,
  ) => React.ReactElement;
  campaignSlug?: CampaignSlug;
};

const firstNameOrNull = (raw: string | undefined): string | null =>
  raw?.trim() ? raw : null;

const PREVIEW_UNSUBSCRIBE_URL =
  "https://cims-sempre-amunt.app/unsubscribe?token=preview";

export const EMAIL_TEMPLATES = {
  welcome: {
    label: "Welcome",
    description: "Sent on first signup. Localized en/ca/es with merch upsell.",
    trigger: "POST /api/public/join (new user branch)",
    fields: {
      firstName: { type: "text", default: "Josep" },
    },
    render: (props, locale, unsubscribeUrl) =>
      WelcomeEmail({
        firstName: firstNameOrNull(props.firstName),
        locale,
        unsubscribeUrl: unsubscribeUrl ?? PREVIEW_UNSUBSCRIBE_URL,
      }),
  },
  reengage_cold: {
    label: "Re-engage: cold signup",
    description:
      "Campaign. Users with 0–1 summits who signed up >30 days ago. Gentle reintroduction.",
    trigger: "Admin-triggered campaign",
    fields: {
      firstName: { type: "text", default: "Josep" },
    },
    render: (props, locale, unsubscribeUrl) =>
      ReengageColdEmail({
        firstName: firstNameOrNull(props.firstName),
        locale,
        unsubscribeUrl: unsubscribeUrl ?? PREVIEW_UNSUBSCRIBE_URL,
      }),
    campaignSlug: "reengage_cold",
  },
  reengage_summer: {
    label: "Re-engage: summer nudge",
    description:
      "Campaign. Users with 2+ summits whose last summit is >90 days old. Seasonal nudge.",
    trigger: "Admin-triggered campaign",
    fields: {
      firstName: { type: "text", default: "Anna" },
    },
    render: (props, locale, unsubscribeUrl) =>
      ReengageSummerEmail({
        firstName: firstNameOrNull(props.firstName),
        locale,
        unsubscribeUrl: unsubscribeUrl ?? PREVIEW_UNSUBSCRIBE_URL,
      }),
    campaignSlug: "reengage_summer",
  },
} satisfies Record<string, EmailTemplate>;

export type EmailSlug = keyof typeof EMAIL_TEMPLATES;

export const isEmailSlug = (s: string): s is EmailSlug =>
  Object.prototype.hasOwnProperty.call(EMAIL_TEMPLATES, s);
