import { User } from "@/api/routes/@shared/types";

type RequestContext = { user: User };

const contexts = new WeakMap<Request, RequestContext>();

export const setRequestContext = (request: Request, ctx: RequestContext) => {
  contexts.set(request, ctx);
};

export const getRequestContext = (request: Request) =>
  contexts.get(request) ?? null;
