import { t } from "elysia";

import { MountainCommentImageSchema } from "@/api/schemas/mountain-comment.schema";

/**
 * Row shape for the admin "Comments" cross-mountain list. Includes enough
 * mountain/author info to render the table without a follow-up fetch.
 */
export const AdminMountainCommentEntrySchema = t.Object({
  id: t.String(),
  body: t.String(),
  images: t.Array(MountainCommentImageSchema),
  upvoteCount: t.Number(),
  parentCommentId: t.Nullable(t.String()),
  createdAt: t.Date(),
  mountain: t.Object({
    id: t.String(),
    name: t.String(),
    slug: t.String(),
    imageUrl: t.Nullable(t.String()),
  }),
  user: t.Object({
    id: t.String(),
    username: t.Nullable(t.String()),
    firstName: t.Nullable(t.String()),
    lastName: t.Nullable(t.String()),
    imageUrl: t.Nullable(t.String()),
    email: t.String(),
  }),
});

export const AdminMountainCommentsListResponseSchema = t.Object({
  items: t.Array(AdminMountainCommentEntrySchema),
  page: t.Number(),
  pageSize: t.Number(),
  total: t.Number(),
  totalPages: t.Number(),
});

/**
 * Detail response for /admin/mountain-comments/:id. Carries the comment plus
 * the thread context: parent (if the comment is itself a reply) and siblings
 * (every other reply on the same top-level thread, ordered oldest-first).
 *
 * `parent` is the parent comment when this row is a reply; siblings are the
 * other replies on the same thread. For a top-level comment, `parent` is
 * null and `siblings` are its own direct replies.
 */
export const AdminMountainCommentDetailResponseSchema = t.Object({
  comment: AdminMountainCommentEntrySchema,
  parent: t.Nullable(AdminMountainCommentEntrySchema),
  siblings: t.Array(AdminMountainCommentEntrySchema),
});
