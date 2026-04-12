import { Elysia } from "elysia";

import { summitDeletePostRoute } from "@/api/routes/protected/summit/summit.delete.post";
import { summitOneGetRoute } from "@/api/routes/protected/summit/summit.one.get";
import { summitReactionPostRoute } from "@/api/routes/protected/summit/summit.reaction.post";
import { summitReactionsGetRoute } from "@/api/routes/protected/summit/summit.reactions.get";
import { summitUpdatePostRoute } from "@/api/routes/protected/summit/summit.update.post";

export const summitRoute = new Elysia({ prefix: "/summit" })
  .use(summitOneGetRoute)
  .use(summitDeletePostRoute)
  .use(summitUpdatePostRoute)
  .use(summitReactionPostRoute)
  .use(summitReactionsGetRoute);
