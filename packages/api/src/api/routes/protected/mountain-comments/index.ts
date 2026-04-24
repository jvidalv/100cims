import { Elysia } from "elysia";

import { mountainCommentCreatePostRoute } from "./mountain-comment.create.post";
import { mountainCommentDeletePostRoute } from "./mountain-comment.delete.post";
import { mountainCommentUpdatePostRoute } from "./mountain-comment.update.post";
import { mountainCommentUpvotePostRoute } from "./mountain-comment.upvote.post";

export const mountainCommentsRoute = new Elysia({
  prefix: "/mountain-comments",
})
  .use(mountainCommentCreatePostRoute)
  .use(mountainCommentUpdatePostRoute)
  .use(mountainCommentUpvotePostRoute)
  .use(mountainCommentDeletePostRoute);
