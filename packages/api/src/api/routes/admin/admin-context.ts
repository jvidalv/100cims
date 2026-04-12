type AdminContext = { userId: string };

const contexts = new WeakMap<Request, AdminContext>();

export const setAdminContext = (request: Request, ctx: AdminContext) => {
  contexts.set(request, ctx);
};

export const getAdminUserId = (request: Request): string => {
  const ctx = contexts.get(request);
  if (!ctx) throw new Error("getAdminUserId called outside admin route");
  return ctx.userId;
};
