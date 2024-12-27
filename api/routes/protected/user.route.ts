import { Elysia, t } from "elysia";
import { JWT } from "@/api/routes/@shared/jwt";
import { User } from "@/api/routes/@shared/types";

export const userRoute = new Elysia({ prefix: "/user" }).use(JWT()).get(
  "/me",
  async ({ store }) => {
    return {
      success: true,
      message: (store as { user: User }).user,
    };
  },
  {
    response: t.Object({
      success: t.Boolean(),
      message: t.Object({
        id: t.String(),
        email: t.String(),
        firstName: t.Nullable(t.String()),
        lastName: t.Nullable(t.String()),
      }),
    }),
  },
);
