import { Elysia, t } from "elysia";
import { uuidv7 } from "uuidv7";

import { db } from "@/db";
import { organizationTable } from "@/db/schema";
import {
  OrganizationImageError,
  resolveOrganizationImageUrl,
  resolveOrganizationPhotoUrls,
} from "@/api/lib/organization-images";
import { AdminOrganizationCreateBodySchema } from "@/api/schemas/admin-organization.schema";
import {
  ErrorFieldResponse,
  SuccessResponse,
} from "@/api/schemas/common.schema";

// Treat "" / null / undefined as "no value" for the three optional text
// columns — matches admin.organization-update.post.ts's normalizeNullable
// so we don't store empty strings on the create path that the update
// route would refuse.
const normalizeOptional = (value: string | null | undefined) =>
  value && value.trim().length > 0 ? value : null;

export const adminOrganizationCreatePostRoute = new Elysia().post(
  "/organizations",
  async ({ body, set }) => {
    // Pre-generate the id so the S3 key can be path-scoped to this org
    // before the row exists. Mirrors admin.plan-create.post.ts.
    const organizationId = uuidv7();

    let imageUrl: string | null;
    let photoUrls: string[];
    try {
      imageUrl = await resolveOrganizationImageUrl(
        body.imageUrl,
        organizationId,
      );
      photoUrls = await resolveOrganizationPhotoUrls(
        body.photoUrls ?? [],
        organizationId,
      );
    } catch (e) {
      if (e instanceof OrganizationImageError) {
        set.status = e.status;
        return { error: e.message };
      }
      throw e;
    }

    await db.insert(organizationTable).values({
      id: organizationId,
      name: body.name,
      description: normalizeOptional(body.description),
      websiteUrl: normalizeOptional(body.websiteUrl),
      imageUrl,
      instagramUrl: normalizeOptional(body.instagramUrl),
      tiktokUrl: normalizeOptional(body.tiktokUrl),
      whatsappUrl: normalizeOptional(body.whatsappUrl),
      youtubeUrl: normalizeOptional(body.youtubeUrl),
      stravaUrl: normalizeOptional(body.stravaUrl),
      photoUrls,
    });

    return { success: true, message: { id: organizationId } };
  },
  {
    body: AdminOrganizationCreateBodySchema,
    response: {
      200: SuccessResponse(t.Object({ id: t.String() })),
      400: ErrorFieldResponse,
      500: ErrorFieldResponse,
    },
  },
);
