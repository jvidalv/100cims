import { Elysia } from "elysia";

import { mountainCommentListGetRoute } from "./mountain-comment.list.get";
import { mountainCommentRepliesGetRoute } from "./mountain-comment.replies.get";
import { mountainCommentTopGetRoute } from "./mountain-comment.top.get";

export const mountainCommentsPublicRoute = new Elysia({
  prefix: "/mountain-comments",
})
  .use(mountainCommentListGetRoute)
  .use(mountainCommentTopGetRoute)
  .use(mountainCommentRepliesGetRoute);
