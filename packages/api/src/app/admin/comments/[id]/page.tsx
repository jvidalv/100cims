"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  useAdminCommentDetail,
  useCreateAdminMountainComment,
  useDeleteAdminComment,
  useUpdateAdminComment,
} from "@/domains/admin/api";
import { formatDateTime } from "@/lib/format-date";
import { adminKeys } from "@/lib/query-keys";

type CommentEntry = NonNullable<
  ReturnType<typeof useAdminCommentDetail>["data"]
>["comment"];

const authorLabel = (user: CommentEntry["user"]) =>
  [user.firstName, user.lastName].filter(Boolean).join(" ") ||
  user.username ||
  user.email;

const authorInitials = (user: CommentEntry["user"]) =>
  (user.firstName?.[0] ?? user.email[0]).toUpperCase();

function CommentCard({
  entry,
  variant = "default",
  rightSlot,
}: {
  entry: CommentEntry;
  variant?: "default" | "muted" | "primary";
  rightSlot?: React.ReactNode;
}) {
  const tone =
    variant === "primary"
      ? "border-primary/40 bg-primary/5"
      : variant === "muted"
        ? "border-border bg-muted/30"
        : "border-border";
  return (
    <div className={`rounded-lg border p-4 ${tone}`}>
      <div className="flex items-start justify-between gap-3">
        <Link
          href={`/admin/users/${entry.user.id}`}
          className="flex items-center gap-2 hover:underline"
        >
          <Avatar className="size-7">
            {entry.user.imageUrl && (
              <AvatarImage
                src={entry.user.imageUrl}
                alt={authorLabel(entry.user)}
              />
            )}
            <AvatarFallback>{authorInitials(entry.user)}</AvatarFallback>
          </Avatar>
          <div className="leading-tight">
            <div className="font-medium">{authorLabel(entry.user)}</div>
            <div className="text-xs text-muted-foreground">
              {formatDateTime(entry.createdAt)} · {entry.upvoteCount} upvotes
            </div>
          </div>
        </Link>
        {rightSlot}
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm">{entry.body}</p>
      {entry.images.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {entry.images.map((img, i) => (
            <a
              key={i}
              href={img.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block size-20 overflow-hidden rounded border"
            >
              <img
                src={img.url}
                alt=""
                width={80}
                height={80}
                className="size-full object-cover"
              />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminCommentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const qc = useQueryClient();
  const { id } = use(params);
  const detail = useAdminCommentDetail(id);
  const update = useUpdateAdminComment(id);
  const remove = useDeleteAdminComment(id);
  // Empty string until detail resolves. The reply form lives below the
  // `if (!detail.data) return null` guard, so the mutation can't fire
  // with an empty mountainId in practice.
  const mountainId = detail.data?.comment.mountain.id ?? "";
  const reply = useCreateAdminMountainComment(mountainId);

  const [body, setBody] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const initialBody = detail.data?.comment.body ?? "";

  useEffect(() => {
    if (!detail.data || update.isPending) return;
    setBody(detail.data.comment.body);
  }, [detail.data, update.isPending]);

  const dirty = body !== initialBody;

  const onSave = () =>
    update.mutate(
      { body },
      {
        onSuccess: () => toast.success("Comment updated"),
        onError: (e) =>
          toast.error(e instanceof Error ? e.message : "Update failed"),
      },
    );

  const onDelete = () =>
    remove.mutate(undefined, {
      onSuccess: () => {
        toast.success("Comment deleted");
        router.push("/admin/comments");
      },
      onError: (e) =>
        toast.error(e instanceof Error ? e.message : "Delete failed"),
    });

  // Reply is parented on THIS comment's thread root: if THIS comment is
  // itself a reply, post under the same root (the API also enforces
  // depth-2 by re-parenting, so this is defensive). If THIS comment is
  // the root, post under it.
  const onReply = () => {
    if (!detail.data) return;
    const parentCommentId =
      detail.data.comment.parentCommentId ?? detail.data.comment.id;
    reply.mutate(
      { body: replyBody, parentCommentId },
      {
        onSuccess: () => {
          toast.success("Reply posted");
          setReplyBody("");
          // Refresh the page-being-viewed: when the current comment is a
          // reply, `parentCommentId` is the thread root, not this page's
          // id — so invalidating the hook-level keys alone misses the
          // siblings list we're staring at.
          void qc.invalidateQueries({ queryKey: adminKeys.commentDetail(id) });
        },
        onError: (e) =>
          toast.error(e instanceof Error ? e.message : "Reply failed"),
      },
    );
  };

  if (detail.isLoading && !detail.data) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (detail.error) {
    return (
      <div className="p-8">
        <p className="text-red-600">{detail.error.message}</p>
      </div>
    );
  }

  if (!detail.data) return null;

  const { comment, parent, siblings } = detail.data;
  const isReply = comment.parentCommentId !== null;

  return (
    <div className="p-8 max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/comments"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Comments
        </Link>
        <Link
          href={`/admin/mountains/${comment.mountain.id}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          on {comment.mountain.name} →
        </Link>
      </div>

      {parent && (
        <section className="space-y-2">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Parent comment
          </h2>
          <CommentCard entry={parent} variant="muted" />
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {isReply ? "This reply" : "This comment"}
        </h2>
        <CommentCard
          entry={comment}
          variant="primary"
          rightSlot={
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive">
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this comment?</AlertDialogTitle>
                  <AlertDialogDescription>
                    The comment and all its replies will be permanently removed.
                    Attached photos remain in storage but become orphaned.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          }
        />

        <div className="rounded-lg border p-4 space-y-2">
          <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Edit body
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full min-h-[120px] rounded border px-3 py-2 text-sm resize-y bg-background"
            maxLength={2000}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {body.length} / 2000
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={!dirty || update.isPending}
                onClick={() => setBody(initialBody)}
              >
                Reset
              </Button>
              <Button
                size="sm"
                disabled={
                  !dirty || update.isPending || body.trim().length === 0
                }
                onClick={onSave}
              >
                {update.isPending ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Reply
        </h2>
        <div className="rounded-lg border p-4 space-y-2">
          <textarea
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            placeholder={
              isReply ? "Reply to this thread…" : "Reply to this comment…"
            }
            className="w-full min-h-[100px] rounded border px-3 py-2 text-sm resize-y bg-background"
            maxLength={2000}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {replyBody.length} / 2000
            </span>
            <Button
              size="sm"
              disabled={reply.isPending || replyBody.trim().length === 0}
              onClick={onReply}
            >
              {reply.isPending ? "Posting…" : "Post reply"}
            </Button>
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {isReply
            ? `Other replies on this thread (${siblings.length})`
            : `Replies (${siblings.length})`}
        </h2>
        {siblings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No other comments.</p>
        ) : (
          <div className="space-y-2">
            {siblings.map((s) => (
              <Link
                key={s.id}
                href={`/admin/comments/${s.id}`}
                className="block transition hover:opacity-80"
              >
                <CommentCard entry={s} />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
