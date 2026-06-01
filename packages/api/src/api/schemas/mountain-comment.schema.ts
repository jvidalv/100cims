import { t } from "elysia";

export const MountainCommentAuthorSchema = t.Object({
  id: t.String(),
  username: t.Nullable(t.String()),
  firstName: t.Nullable(t.String()),
  lastName: t.Nullable(t.String()),
  imageUrl: t.Nullable(t.String()),
  hasSummitedThisMountain: t.Boolean(),
});

// JSONB array on `mountain_comment`. v1 each item is just `{ url }`; the
// shape is deliberately a t.Object so future per-image metadata (caption,
// description) can be added additively without another schema migration.
export const MountainCommentImageSchema = t.Object({
  url: t.String(),
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
  // Optional so old mobile builds whose types/api.ts predates this field
  // don't fail strict parse. New clients always read `images ?? []`.
  images: t.Optional(t.Array(MountainCommentImageSchema)),
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
  // Up to 5 base64-encoded JPEGs. Per-image runtime size enforced via
  // `isBase64SizeValid` (3 MB compressed); the per-string `maxLength` here
  // is a generous schema-level guardrail (5 MB base64 ≈ 3.75 MB binary).
  images: t.Optional(
    t.Array(t.String({ maxLength: 5_000_000 }), { maxItems: 5 }),
  ),
});

export const UpdateMountainCommentBody = t.Object({
  id: t.String(),
  body: t.String({ minLength: 1, maxLength: 2000 }),
  // Mixed array: existing image URLs (kept as-is) and new base64 JPEGs (the
  // server uploads to S3 and stores the resolved URL). Items dropped from
  // this list are removed from the comment's JSONB; their S3 objects are
  // intentionally not pruned — orphaning is cheaper than tracking refs.
  // Omit to leave images untouched.
  images: t.Optional(
    t.Array(t.String({ maxLength: 5_000_000 }), { maxItems: 5 }),
  ),
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
