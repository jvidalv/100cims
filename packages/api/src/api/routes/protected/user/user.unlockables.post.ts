import { Elysia, t } from "elysia";

import { getUserFromRequest } from "@/api/routes/@shared/auth";
import { unlockIcon } from "@/api/routes/@shared/unlockables";
import { SimpleSuccessResponse } from "@/api/schemas/common.schema";
import { UnlockableSchema } from "@/api/schemas/unlockables";

export const userUnlockablesPostRoute = new Elysia().post(
  "/unlockables",
  async ({ body, request }) => {
    const user = getUserFromRequest(request);
    await unlockIcon(user.id, body.key);
    return { success: true };
  },
  {
    body: t.Object({
      key: UnlockableSchema,
    }),
    response: {
      200: SimpleSuccessResponse,
    },
  },
);
