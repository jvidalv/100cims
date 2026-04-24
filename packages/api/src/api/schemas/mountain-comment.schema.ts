import { t } from "elysia";

export const MountainCommentAuthorSchema = t.Object({
  id: t.String(),
  username: t.Nullable(t.String()),
  firstName: t.Nullable(t.String()),
  lastName: t.Nullable(t.String()),
  imageUrl: t.Nullable(t.String()),
  hasSummitedThisMountain: t.Boolean(),
});

// Reduced parent preview embedded on replies in search-mode responses,
// so the client can render "Replying to …" context without a second request.
export const MountainCommentParentSchema = t.Object({
  id: t.String(),
  body: t.String(),
  user: MountainCommentAuthorSchema,
});

export const MountainCommentSchema = t.Object({
  id: t.String(),
  mountainId: t.String(),
  parentCommentId: t.Nullable(t.String()),
  body: t.String(),
  upvoteCount: t.Number(),
  viewerHasUpvoted: t.Boolean(),
  createdAt: t.Date(),
  updatedAt: t.Date(),
  user: MountainCommentAuthorSchema,
  parent: t.Optional(MountainCommentParentSchema),
  // Only set on top-level rows returned by /list — total replies for this
  // thread. Client compares against the replies it has inline to decide
  // whether to show "Show all N" button.
  replyCount: t.Optional(t.Number()),
});

export const MountainCommentsResponseSchema = t.Array(MountainCommentSchema);

// Used by the /top endpoint: top-N comments + a total count of comments on
// the mountain, so the detail page can show "All comments (N)".
export const MountainTopCommentsResponseSchema = t.Object({
  items: t.Array(MountainCommentSchema),
  total: t.Number(),
});

export const MountainCommentsPageSchema = t.Object({
  items: t.Array(MountainCommentSchema),
  nextCursor: t.Nullable(t.String()),
  // Total count of comments (top-level + replies) matching the current filters
  // for this mountain. Stable across pages.
  total: t.Number(),
});

export const CreateMountainCommentBody = t.Object({
  mountainId: t.String(),
  parentCommentId: t.Optional(t.String()),
  body: t.String({ minLength: 1, maxLength: 2000 }),
});

export const UpdateMountainCommentBody = t.Object({
  id: t.String(),
  body: t.String({ minLength: 1, maxLength: 2000 }),
});

export const UpvoteMountainCommentBody = t.Object({
  commentId: t.String(),
});

export const DeleteMountainCommentBody = t.Object({
  id: t.String(),
});

export const UpvoteMountainCommentResponseSchema = t.Object({
  commentId: t.String(),
  upvoteCount: t.Number(),
  viewerHasUpvoted: t.Boolean(),
});
