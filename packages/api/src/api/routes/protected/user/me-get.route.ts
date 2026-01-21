import { Elysia } from "elysia";

import { JWT } from "@/api/routes/@shared/jwt";
import { getStoreUser } from "@/api/routes/@shared/store";
import { SuccessResponse } from "@/api/schemas/common.schema";
import { UserSchema } from "@/api/schemas/user.schema";

export const meGetRoute = new Elysia().use(JWT()).get(
  "/me",
  async ({ store }) => {
    return {
      success: true,
      message: getStoreUser(store),
    };
  },
  {
    response: SuccessResponse(UserSchema),
  },
);
