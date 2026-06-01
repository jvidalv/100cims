import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { uuidv7 } from "uuidv7";

import { db } from "@/db";
import { shopRequestTable } from "@/db/schema";
import { isBase64SizeValid, reportImageTooBig } from "@/api/lib/images";
import {
  IMAGE_TO_BIG,
  IMAGE_UPLOAD_FAILED,
} from "@/api/routes/@shared/error-codes";
import { getUserFromRequest } from "@/api/routes/@shared/auth";
import { getPublicUrl, putImageOnS3 } from "@/api/routes/@shared/s3";
import {
  ErrorFieldResponse,
  SimpleSuccessResponse,
} from "@/api/schemas/common.schema";

// Buyer uploads a screenshot of their Bizum confirmation after placing an
// order. We persist the public S3 URL onto the shop_request row and bump
// the status from `requested` to `contacted` so the admin funnel
// surfaces it. Ownership is gated to the original buyer — we don't want
// random users attaching screenshots to other people's orders.
export const shopRequestPaymentPostRoute = new Elysia().post(
  "/shop-requests/:id/payment",
  async ({ params, body, request, set }) => {
    const user = getUserFromRequest(request);

    const [row] = await db
      .select({
        id: shopRequestTable.id,
        userId: shopRequestTable.userId,
        status: shopRequestTable.status,
      })
      .from(shopRequestTable)
      .where(eq(shopRequestTable.id, params.id));

    if (!row) {
      set.status = 404;
      return { error: "Shop request not found" };
    }

    if (row.userId !== user.id) {
      set.status = 403;
      return { error: "Not your shop request" };
    }

    // The order has already been resolved by admin — don't let a slow
    // buyer overwrite a screenshot on a closed request.
    if (row.status === "done" || row.status === "cancelled") {
      set.status = 409;
      return { error: "Shop request is already closed" };
    }

    if (!isBase64SizeValid(body.image)) {
      reportImageTooBig(request, {
        route: "shop-request-payment",
        base64Data: body.image,
        userId: user.id,
      });
      set.status = 500;
      return { error: IMAGE_TO_BIG };
    }

    const key = `${process.env.APP_NAME}/shop/payment/${row.id}/${uuidv7()}.jpeg`;
    let paymentImageUrl: string;
    try {
      await putImageOnS3(key, Buffer.from(body.image, "base64"));
      paymentImageUrl = getPublicUrl(key);
    } catch {
      set.status = 500;
      return { error: IMAGE_UPLOAD_FAILED };
    }

    // Buyer-side upload bumps `requested → contacted` so the admin
    // funnel surfaces it. `contacted` stays put (idempotent re-upload).
    // `done`/`cancelled` are rejected above with a 409.
    await db
      .update(shopRequestTable)
      .set({
        paymentImageUrl,
        status: "contacted",
        updatedAt: new Date(),
      })
      .where(eq(shopRequestTable.id, row.id));

    return { success: true };
  },
  {
    params: t.Object({ id: t.String() }),
    body: t.Object({ image: t.String() }),
    response: {
      200: SimpleSuccessResponse,
      403: ErrorFieldResponse,
      404: ErrorFieldResponse,
      409: ErrorFieldResponse,
      500: ErrorFieldResponse,
    },
  },
);
