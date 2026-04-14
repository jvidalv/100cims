import {
  WelcomeEmail,
  type WelcomeEmailLocale,
} from "../../../../emails/welcome";

export const EMAIL_LOCALES: WelcomeEmailLocale[] = ["en", "ca", "es"];

type WelcomeProps = { firstName: string | null; locale: WelcomeEmailLocale };

type FieldDef =
  | { type: "text"; default: string }
  | { type: "select"; default: string; options: readonly string[] };

export type EmailTemplate = {
  label: string;
  description: string;
  trigger: string;
  fields: Record<string, FieldDef>;
  render: (
    props: Record<string, string>,
    locale: WelcomeEmailLocale,
  ) => React.ReactElement;
};

export const EMAIL_TEMPLATES = {
  welcome: {
    label: "Welcome",
    description: "Sent on first signup. Localized en/ca/es with merch upsell.",
    trigger: "POST /api/public/join (new user branch)",
    fields: {
      firstName: { type: "text", default: "Josep" },
    },
    render: (props, locale) => {
      const welcomeProps: WelcomeProps = {
        firstName: props.firstName?.trim() ? props.firstName : null,
        locale,
      };
      return WelcomeEmail(welcomeProps);
    },
  },
} satisfies Record<string, EmailTemplate>;

export type EmailSlug = keyof typeof EMAIL_TEMPLATES;

export const isEmailSlug = (s: string): s is EmailSlug =>
  Object.prototype.hasOwnProperty.call(EMAIL_TEMPLATES, s);
