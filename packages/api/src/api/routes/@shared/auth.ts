import { getRequestContext } from "@/api/routes/@shared/request-context";
import { User } from "@/api/routes/@shared/types";

export const getUserFromRequest = (request: Request): User => {
  const ctx = getRequestContext(request);
  if (!ctx?.user) {
    throw new Error("getUserFromRequest called outside a protected route");
  }
  return ctx.user;
};
