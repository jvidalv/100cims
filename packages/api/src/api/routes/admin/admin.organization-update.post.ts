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

// Normalize empty strings to null for nullable text fields so the admin form
// can clear them by submitting "". `undefined` (key absent) stays absent so
// partial-update behaviour is preserved.
const normalizeNullable = (value: string | null | undefined) =>
  value === "" ? null : value;

export const adminOrganizationUpdatePostRoute = new Elysia().post(
  "/organizations/:id",
  async ({ params, body, set }) => {
    const description = normalizeNullable(body.description);
    const websiteUrl = normalizeNullable(body.websiteUrl);

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
        // Spread first, then override with normalized values — keys later
        // in the object literal win. Do NOT reorder; a reformatter that
        // alphabetised these keys would silently re-introduce un-normalized
        // empty strings into the DB.
        ...body,
        description,
        websiteUrl,
        imageUrl,
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
