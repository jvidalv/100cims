import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { organizationTable } from "@/db/schema";
import {
  OrganizationImageError,
  resolveOrganizationImageUrl,
} from "@/api/lib/organization-images";
import { AdminOrganizationUpdateBodySchema } from "@/api/schemas/admin-organization.schema";
import {
  ErrorFieldResponse,
  SimpleSuccessResponse,
} from "@/api/schemas/common.schema";

// Normalize empty / whitespace-only strings to null for nullable text fields
// so the admin form can clear them by submitting "" (and a stray space doesn't
// persist as a phantom value the mobile screen would try to render). `undefined`
// (key absent) stays absent so partial-update behaviour is preserved. Matches
// the trim-then-empty rule used by `normalizeOptional` in the create route.
const normalizeNullable = (value: string | null | undefined) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return value.trim() === "" ? null : value.trim();
};

export const adminOrganizationUpdatePostRoute = new Elysia().post(
  "/organizations/:id",
  async ({ params, body, set }) => {
    const description = normalizeNullable(body.description);
    const websiteUrl = normalizeNullable(body.websiteUrl);
    const instagramUrl = normalizeNullable(body.instagramUrl);
    const tiktokUrl = normalizeNullable(body.tiktokUrl);
    const whatsappUrl = normalizeNullable(body.whatsappUrl);
    const youtubeUrl = normalizeNullable(body.youtubeUrl);
    const stravaUrl = normalizeNullable(body.stravaUrl);

    // imageUrl resolution mirrors admin.plan-update.post.ts:
    //   `undefined`         → key not in body, leave the column alone
    //   `null` / `""`       → caller wants to clear the image
    //   http(s) URL string  → keep as-is
    //   base64 payload      → upload to S3 under this org's prefix, return URL
    let imageUrl: string | null | undefined;
    if (body.imageUrl === undefined) {
      imageUrl = undefined;
    } else if (body.imageUrl === null || body.imageUrl === "") {
      imageUrl = null;
    } else {
      try {
        imageUrl = await resolveOrganizationImageUrl(body.imageUrl, params.id);
      } catch (e) {
        if (e instanceof OrganizationImageError) {
          set.status = e.status;
          return { error: e.message };
        }
        throw e;
      }
    }

    const [row] = await db
      .update(organizationTable)
      .set({
        // Spread first, then override every normalized field — keys later
        // in the object literal win. Do NOT reorder; a reformatter that
        // alphabetised these keys would silently re-introduce un-normalized
        // empty / whitespace strings into the DB. Every column listed below
        // must stay after `...body`: description, websiteUrl, imageUrl,
        // instagramUrl, tiktokUrl, whatsappUrl, youtubeUrl, stravaUrl.
        ...body,
        description,
        websiteUrl,
        imageUrl,
        instagramUrl,
        tiktokUrl,
        whatsappUrl,
        youtubeUrl,
        stravaUrl,
        updatedAt: new Date(),
      })
      .where(eq(organizationTable.id, params.id))
      .returning({ id: organizationTable.id });

    if (!row) {
      set.status = 404;
      return { error: "Organization not found" };
    }
    return { success: true };
  },
  {
    params: t.Object({ id: t.String() }),
    body: AdminOrganizationUpdateBodySchema,
    response: {
      200: SimpleSuccessResponse,
      400: ErrorFieldResponse,
      404: ErrorFieldResponse,
      500: ErrorFieldResponse,
    },
  },
);
