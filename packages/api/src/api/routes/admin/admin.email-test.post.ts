import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { userTable } from "@/db/schema";
import { signEmailToken } from "@/api/lib/email-tokens";
import { sendRenderedEmail, subjectForTemplate } from "@/api/lib/email";
import { getAdminUserId } from "@/api/routes/admin/admin-context";
import { EMAIL_TEMPLATES, isEmailSlug } from "@/app/admin/emails/_registry";
import {
  ErrorFieldResponse,
  SimpleSuccessResponse,
} from "@/api/schemas/common.schema";
import { SITE_URL } from "@/lib/app-links";

export const adminEmailTestPostRoute = new Elysia().post(
  "/emails/test",
  async ({ body, request, set }) => {
    if (!isEmailSlug(body.slug)) {
      set.status = 400;
      return { error: "Unknown email template" };
    }
    const template = EMAIL_TEMPLATES[body.slug];

    const adminId = getAdminUserId(request);
    const [admin] = await db
      .select({ email: userTable.email })
      .from(userTable)
      .where(eq(userTable.id, adminId));
    if (!admin?.email) {
      set.status = 400;
      return { error: "Admin user has no email" };
    }

    const unsubscribeToken = await signEmailToken(adminId, "unsubscribe");
    const unsubscribeUrl = `${SITE_URL}/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}&lang=${body.locale}`;
    const react = template.render(
      body.props ?? {},
      body.locale,
      unsubscribeUrl,
    );
    const subject = `[TEST] ${subjectForTemplate(body.slug, body.locale)}`;
    const result = await sendRenderedEmail(
      {
        to: admin.email,
        subject,
        react,
        headers: {
          "List-Unsubscribe": `<${unsubscribeUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      },
      { force: true },
    );
    if (!result.ok) {
      set.status = 500;
      return { error: result.error ?? "Send failed" };
    }
    return { success: true };
  },
  {
    body: t.Object({
      slug: t.String(),
      locale: t.Union([t.Literal("en"), t.Literal("ca"), t.Literal("es")]),
      props: t.Optional(t.Record(t.String(), t.String())),
    }),
    response: {
      200: SimpleSuccessResponse,
      400: ErrorFieldResponse,
      500: ErrorFieldResponse,
    },
  },
);
