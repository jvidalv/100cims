import { Elysia } from "elysia";

import { getUserFromRequest } from "@/api/routes/@shared/auth";
import { SuccessResponse } from "@/api/schemas/common.schema";
import { UserSchema } from "@/api/schemas/user.schema";

export const userMeGetRoute = new Elysia().get(
  "/me",
  async ({ request }) => {
    return {
      success: true,
      message: getUserFromRequest(request),
    };
  },
  {
    response: SuccessResponse(UserSchema),
  },
);
