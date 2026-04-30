"use client";

import { Dog, Mountain as MountainIcon, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  type AdminMountainUpdateBody,
  useAdminMountainChallenges,
  useAdminMountainComments,
  useAdminMountainDetail,
  useAdminMountainRatings,
  useCreateAdminMountainComment,
  useDeleteAdminMountain,
  useDeleteAdminMountainComment,
  useDeleteAdminMountainRating,
  useUpdateAdminMountain,
  useUpdateAdminMountainComment,
  useUpvoteAdminMountainComment,
} from "@/domains/admin/api";
import { formatDate, formatDateTime } from "@/lib/format-date";
import { formatRating } from "@/lib/format-rating";

type Form = {
  name: string;
  location: string;
  height: string;
  latitude: string;
  longitude: string;
  url: string;
  imageUrl: string;
  essential: boolean;
};

const emptyForm: Form = {
  name: "",
  location: "",
  height: "",
  latitude: "",
  longitude: "",
  url: "",
  imageUrl: "",
  essential: false,
};

export default function AdminMountainDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const detail = useAdminMountainDetail(id);
  const challenges = useAdminMountainChallenges(id);
  const ratings = useAdminMountainRatings(id);
  const comments = useAdminMountainComments(id);
  const update = useUpdateAdminMountain(id);
  const deleteMountain = useDeleteAdminMountain(id);
  const deleteRating = useDeleteAdminMountainRating(id);
  const createComment = useCreateAdminMountainComment(id);
  const updateComment = useUpdateAdminMountainComment(id);
  const upvoteComment = useUpvoteAdminMountainComment(id);
  const deleteComment = useDeleteAdminMountainComment(id);

  const onDelete = () =>
    deleteMountain.mutate(undefined, {
      onSuccess: () => {
        toast.success("Mountain deleted");
        router.push("/admin/mountains");
      },
      onError: (e) =>
        toast.error(e instanceof Error ? e.message : "Delete failed"),
    });

  const [form, setForm] = useState<Form>(emptyForm);
  const [initial, setInitial] = useState<Form>(emptyForm);

  useEffect(() => {
    if (!detail.data || update.isPending) return;
    const next: Form = {
      name: detail.data.name,
      location: detail.data.location,
      height: detail.data.height,
      latitude: detail.data.latitude,
      longitude: detail.data.longitude,
      url: detail.data.url ?? "",
      imageUrl: detail.data.imageUrl ?? "",
      essential: detail.data.essential,
    };
    setForm(next);
    setInitial(next);
  }, [detail.data, update.isPending]);

  const dirty = (Object.keys(form) as (keyof Form)[]).some(
    (k) => form[k] !== initial[k],
  );

  const onSave = () => {
    const body: AdminMountainUpdateBody = {};
    if (form.name !== initial.name) body.name = form.name;
    if (form.location !== initial.location) body.location = form.location;
    if (form.height !== initial.height) body.height = form.height;
    if (form.latitude !== initial.latitude) body.latitude = form.latitude;
    if (form.longitude !== initial.longitude) body.longitude = form.longitude;
    if (form.url !== initial.url) body.url = form.url || null;
    if (form.imageUrl !== initial.imageUrl)
      body.imageUrl = form.imageUrl || null;
    if (form.essential !== initial.essential) body.essential = form.essential;

    update.mutate(body, {
      onSuccess: () => toast.success("Saved"),
      onError: (e) =>
        toast.error(e instanceof Error ? e.message : "Update failed"),
    });
  };

  if (detail.isLoading && !detail.data) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (detail.error || !detail.data) {
    return (
      <div className="p-8 space-y-2">
        <Link
          href="/admin/mountains"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Mountains
        </Link>
        <p className="text-red-600">
          {detail.error?.message ?? "Mountain not found"}
        </p>
      </div>
    );
  }

  const m = detail.data;
  const initials = m.name.slice(0, 2).toUpperCase();

  return (
    <div className="p-8 space-y-8">
      <div className="space-y-1">
        <Link
          href="/admin/mountains"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Mountains
        </Link>
        <div className="flex items-center gap-3 mt-2">
          <Avatar className="size-10">
            {m.imageUrl && <AvatarImage src={m.imageUrl} alt={m.name} />}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold leading-tight">{m.name}</h1>
            <p className="text-sm text-muted-foreground font-mono">{m.slug}</p>
          </div>
        </div>
      </div>

      <section className="space-y-4 max-w-2xl">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Profile
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldText
            label="Name"
            value={form.name}
            onChange={(v) => setForm((p) => ({ ...p, name: v }))}
          />
          <FieldText
            label="Location"
            value={form.location}
            onChange={(v) => setForm((p) => ({ ...p, location: v }))}
          />
          <FieldText
            label="Height (m)"
            value={form.height}
            onChange={(v) => setForm((p) => ({ ...p, height: v }))}
          />
          <FieldText
            label="Latitude"
            value={form.latitude}
            onChange={(v) => setForm((p) => ({ ...p, latitude: v }))}
          />
          <FieldText
            label="Longitude"
            value={form.longitude}
            onChange={(v) => setForm((p) => ({ ...p, longitude: v }))}
          />
          <FieldText
            label="External URL"
            value={form.url}
            onChange={(v) => setForm((p) => ({ ...p, url: v }))}
            placeholder="https://…"
          />
          <div className="md:col-span-2">
            <FieldText
              label="Image URL"
              value={form.imageUrl}
              onChange={(v) => setForm((p) => ({ ...p, imageUrl: v }))}
              placeholder="https://bucket.s3.…/mountain.jpg"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.essential}
            onChange={(e) =>
              setForm((p) => ({ ...p, essential: e.target.checked }))
            }
          />
          <span>Essential</span>
        </label>

        <div className="flex items-center gap-3">
          <Button disabled={!dirty || update.isPending} onClick={onSave}>
            {update.isPending ? "Saving…" : "Save"}
          </Button>
          {dirty && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setForm(initial)}
              disabled={update.isPending}
            >
              Reset
            </Button>
          )}
        </div>
      </section>

      <section className="space-y-3 max-w-2xl">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Info
        </h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Creator</dt>
          <dd>{m.isOfficial ? "Official" : (m.creatorName ?? "—")}</dd>
          <dt className="text-muted-foreground">Created</dt>
          <dd>{formatDate(m.createdAt)}</dd>
        </dl>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Challenges {challenges.data ? `(${challenges.data.length})` : ""}
        </h2>

        {challenges.error && (
          <p className="text-red-600">{challenges.error.message}</p>
        )}
        {challenges.isLoading && !challenges.data && (
          <p className="text-muted-foreground">Loading…</p>
        )}

        {challenges.data && challenges.data.length === 0 && (
          <p className="text-muted-foreground">
            This mountain isn&apos;t in any challenge.
          </p>
        )}

        {challenges.data && challenges.data.length > 0 && (
          <ul className="divide-y border rounded">
            {challenges.data.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar className="size-8">
                  {c.imageUrl && <AvatarImage src={c.imageUrl} alt={c.name} />}
                  <AvatarFallback>
                    {c.emoji ?? c.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{c.name}</span>
                <Badge
                  variant={c.isOfficial ? "neutral" : "sky"}
                  label={c.isOfficial ? "Official" : "Custom"}
                />
                <Badge
                  variant={c.isPublic ? "green" : "amber"}
                  label={c.isPublic ? "Public" : "Private"}
                />
                {!c.isOfficial && c.creatorName && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    by {c.creatorName}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Ratings {ratings.data ? `(${ratings.data.length})` : ""}
        </h2>

        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-muted-foreground">Family </span>
            <span className="font-medium">
              {formatRating(m.avgFamilyFriendly, m.familyRatingCount)} / 5
            </span>
            <span className="text-muted-foreground">
              {" "}
              · {m.familyRatingCount} rating
              {m.familyRatingCount === 1 ? "" : "s"}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Dog </span>
            <span className="font-medium">
              {formatRating(m.avgDogFriendly, m.dogRatingCount)} / 5
            </span>
            <span className="text-muted-foreground">
              {" "}
              · {m.dogRatingCount} rating
              {m.dogRatingCount === 1 ? "" : "s"}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Difficulty </span>
            <span className="font-medium">
              {formatRating(m.avgDifficulty, m.difficultyRatingCount)} / 5
            </span>
            <span className="text-muted-foreground">
              {" "}
              · {m.difficultyRatingCount} rating
              {m.difficultyRatingCount === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        {ratings.error && (
          <p className="text-red-600">{ratings.error.message}</p>
        )}
        {ratings.isLoading && !ratings.data && (
          <p className="text-muted-foreground">Loading…</p>
        )}

        {ratings.data && ratings.data.length === 0 && (
          <p className="text-muted-foreground">No ratings yet.</p>
        )}

        {ratings.data && ratings.data.length > 0 && (
          <ul className="divide-y border rounded">
            {ratings.data.map((r) => {
              const fullName = [r.user.firstName, r.user.lastName]
                .filter(Boolean)
                .join(" ");
              const displayName = fullName || r.user.email;
              const initials = (fullName || r.user.email)
                .slice(0, 2)
                .toUpperCase();
              return (
                <li
                  key={r.id}
                  className="flex items-center gap-3 px-4 py-3 text-sm"
                >
                  <Avatar className="size-9 shrink-0">
                    {r.user.imageUrl && (
                      <AvatarImage src={r.user.imageUrl} alt={displayName} />
                    )}
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 max-w-[220px]">
                    <Link
                      href={`/admin/users/${r.user.id}`}
                      className="font-medium hover:underline block truncate"
                    >
                      {displayName}
                    </Link>
                    <p className="text-xs text-muted-foreground truncate">
                      {r.user.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <RatingBadge
                      icon={<Users className="size-3.5" />}
                      label="Family"
                      value={r.familyFriendly}
                      tone="sky"
                    />
                    <RatingBadge
                      icon={<Dog className="size-3.5" />}
                      label="Dog"
                      value={r.dogFriendly}
                      tone="amber"
                    />
                    <RatingBadge
                      icon={<MountainIcon className="size-3.5" />}
                      label="Difficulty"
                      value={r.difficulty}
                      tone="violet"
                    />
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDateTime(r.updatedAt)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={deleteRating.isPending}
                      onClick={() =>
                        deleteRating.mutate(r.id, {
                          onSuccess: () => toast.success("Rating deleted"),
                          onError: (e) =>
                            toast.error(
                              e instanceof Error ? e.message : "Delete failed",
                            ),
                        })
                      }
                    >
                      Delete
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <CommentsSection
        mountainId={id}
        comments={comments.data}
        isLoading={comments.isLoading}
        error={comments.error}
        onCreate={(input) =>
          new Promise<void>((resolve, reject) => {
            createComment.mutate(input, {
              onSuccess: () => {
                toast.success(
                  input.parentCommentId ? "Reply posted" : "Comment posted",
                );
                resolve();
              },
              onError: (e) => {
                toast.error(e instanceof Error ? e.message : "Post failed");
                reject(e);
              },
            });
          })
        }
        onUpdate={(input) =>
          new Promise<void>((resolve, reject) => {
            updateComment.mutate(input, {
              onSuccess: () => {
                toast.success("Comment updated");
                resolve();
              },
              onError: (e) => {
                toast.error(e instanceof Error ? e.message : "Update failed");
                reject(e);
              },
            });
          })
        }
        onUpvote={(commentId) =>
          upvoteComment.mutate(commentId, {
            onError: (e) =>
              toast.error(e instanceof Error ? e.message : "Upvote failed"),
          })
        }
        onDelete={(commentId) =>
          deleteComment.mutate(commentId, {
            onSuccess: () => toast.success("Comment deleted"),
            onError: (e) =>
              toast.error(e instanceof Error ? e.message : "Delete failed"),
          })
        }
        createPending={createComment.isPending}
        updatePending={updateComment.isPending}
      />

      <section className="space-y-3 max-w-2xl pt-4 border-t border-destructive/30">
        <h2 className="text-sm font-medium text-destructive uppercase tracking-wide">
          Danger zone
        </h2>
        <p className="text-sm text-muted-foreground">
          Deleting this mountain removes all its summits, summit reactions, and
          challenge links. This cannot be undone.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={deleteMountain.isPending}>
              Delete mountain
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {m.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                This deletes the mountain, all its summits (including every
                user&apos;s record of summiting it), and removes it from every
                challenge. Cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={onDelete}
              >
                {deleteMountain.isPending ? "Deleting…" : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </div>
  );
}

function FieldText({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

const BADGE_TONES = {
  neutral: "bg-muted text-foreground",
  muted: "bg-muted text-muted-foreground",
  sky: "bg-sky-100 text-sky-900 dark:bg-sky-900/30 dark:text-sky-300",
  green: "bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-300",
  amber: "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-300",
  violet:
    "bg-violet-100 text-violet-900 dark:bg-violet-900/30 dark:text-violet-300",
} as const;

type BadgeTone = keyof typeof BADGE_TONES;

function Badge({ label, variant }: { label: string; variant: BadgeTone }) {
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${BADGE_TONES[variant]}`}
    >
      {label}
    </span>
  );
}

function RatingBadge({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | null;
  tone: BadgeTone;
}) {
  return (
    <span
      title={`${label}: ${value ?? "not rated"}`}
      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium tabular-nums ${
        value === null ? BADGE_TONES.muted : BADGE_TONES[tone]
      }`}
    >
      {icon}
      <span>{value ?? "—"}</span>
    </span>
  );
}

type AdminComment = NonNullable<
  ReturnType<typeof useAdminMountainComments>["data"]
>[number];

function CommentsSection({
  mountainId,
  comments,
  isLoading,
  error,
  onCreate,
  onUpdate,
  onUpvote,
  onDelete,
  createPending,
  updatePending,
}: {
  mountainId: string;
  comments: AdminComment[] | undefined;
  isLoading: boolean;
  error: Error | null;
  onCreate: (input: {
    body: string;
    parentCommentId?: string;
  }) => Promise<void>;
  onUpdate: (input: { id: string; body: string }) => Promise<void>;
  onUpvote: (commentId: string) => void;
  onDelete: (commentId: string) => void;
  createPending: boolean;
  updatePending: boolean;
}) {
  void mountainId;
  const [newBody, setNewBody] = useState("");
  // replyAnchorId = the comment the user clicked Reply on (where the composer
  // shows visually). The server-side parent is always the top-level ancestor,
  // resolved from the anchor's parentCommentId or its own id.
  const [replyAnchorId, setReplyAnchorId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [editTargetId, setEditTargetId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");

  const topLevel = (comments ?? []).filter((c) => c.parentCommentId === null);
  const repliesByParent = new Map<string, AdminComment[]>();
  for (const c of comments ?? []) {
    if (c.parentCommentId) {
      const list = repliesByParent.get(c.parentCommentId) ?? [];
      list.push(c);
      repliesByParent.set(c.parentCommentId, list);
    }
  }

  const submitTopLevel = async () => {
    const trimmed = newBody.trim();
    if (!trimmed) return;
    await onCreate({ body: trimmed });
    setNewBody("");
  };

  const submitReply = async (parentCommentId: string) => {
    const trimmed = replyBody.trim();
    if (!trimmed) return;
    await onCreate({ body: trimmed, parentCommentId });
    setReplyBody("");
    setReplyAnchorId(null);
  };

  // Inline reply composer, reused under either a top-level or a sub-comment.
  const ReplyComposer = ({ topLevelId }: { topLevelId: string }) => (
    <div className="space-y-2 mt-2">
      <textarea
        value={replyBody}
        onChange={(e) => setReplyBody(e.target.value)}
        placeholder="Write a reply…"
        className="w-full min-h-[60px] rounded border px-3 py-2 text-sm resize-y bg-background"
        maxLength={2000}
        autoFocus
      />
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          disabled={!replyBody.trim() || createPending}
          onClick={() => {
            void submitReply(topLevelId);
          }}
        >
          {createPending ? "Posting…" : "Reply"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setReplyAnchorId(null);
            setReplyBody("");
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );

  const submitEdit = async (commentId: string) => {
    const trimmed = editBody.trim();
    if (!trimmed) return;
    await onUpdate({ id: commentId, body: trimmed });
    setEditBody("");
    setEditTargetId(null);
  };

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
        Comments {comments ? `(${comments.length})` : ""}
      </h2>

      {/* New top-level composer */}
      <div className="space-y-2 max-w-2xl">
        <textarea
          value={newBody}
          onChange={(e) => setNewBody(e.target.value)}
          placeholder="Write a comment…"
          className="w-full min-h-[80px] rounded border px-3 py-2 text-sm resize-y bg-background"
          maxLength={2000}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {newBody.length} / 2000
          </span>
          <Button
            size="sm"
            disabled={!newBody.trim() || createPending}
            onClick={() => {
              void submitTopLevel();
            }}
          >
            {createPending ? "Posting…" : "Post"}
          </Button>
        </div>
      </div>

      {error && <p className="text-red-600">{error.message}</p>}
      {isLoading && !comments && (
        <p className="text-muted-foreground">Loading…</p>
      )}
      {comments && comments.length === 0 && (
        <p className="text-muted-foreground">No comments yet.</p>
      )}

      {topLevel.length > 0 && (
        <ul className="space-y-3">
          {topLevel.map((c) => (
            <li key={c.id} className="space-y-2">
              <CommentRow
                comment={c}
                onUpvote={onUpvote}
                onDelete={onDelete}
                onStartReply={() => {
                  setReplyAnchorId(c.id);
                  setReplyBody("");
                }}
                onStartEdit={() => {
                  setEditTargetId(c.id);
                  setEditBody(c.body);
                }}
                isEditing={editTargetId === c.id}
                editBody={editBody}
                setEditBody={setEditBody}
                onSubmitEdit={() => {
                  void submitEdit(c.id);
                }}
                onCancelEdit={() => {
                  setEditTargetId(null);
                  setEditBody("");
                }}
                updatePending={updatePending}
              />
              {replyAnchorId === c.id && <ReplyComposer topLevelId={c.id} />}
              {(repliesByParent.get(c.id) ?? []).length > 0 && (
                <ul className="ml-10 space-y-2 border-l pl-4">
                  {(repliesByParent.get(c.id) ?? []).map((reply) => (
                    <li key={reply.id} className="space-y-2">
                      <CommentRow
                        comment={reply}
                        onUpvote={onUpvote}
                        onDelete={onDelete}
                        onStartReply={() => {
                          setReplyAnchorId(reply.id);
                          setReplyBody("");
                        }}
                        onStartEdit={() => {
                          setEditTargetId(reply.id);
                          setEditBody(reply.body);
                        }}
                        isEditing={editTargetId === reply.id}
                        editBody={editBody}
                        setEditBody={setEditBody}
                        onSubmitEdit={() => {
                          void submitEdit(reply.id);
                        }}
                        onCancelEdit={() => {
                          setEditTargetId(null);
                          setEditBody("");
                        }}
                        updatePending={updatePending}
                      />
                      {replyAnchorId === reply.id && (
                        <ReplyComposer topLevelId={c.id} />
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function CommentRow({
  comment,
  onUpvote,
  onDelete,
  onStartReply,
  onStartEdit,
  isEditing,
  editBody,
  setEditBody,
  onSubmitEdit,
  onCancelEdit,
  updatePending,
}: {
  comment: AdminComment;
  onUpvote: (commentId: string) => void;
  onDelete: (commentId: string) => void;
  onStartReply?: () => void;
  onStartEdit: () => void;
  isEditing: boolean;
  editBody: string;
  setEditBody: (v: string) => void;
  onSubmitEdit: () => void;
  onCancelEdit: () => void;
  updatePending: boolean;
}) {
  return (
    <div className="flex gap-3">
      <Avatar className="size-8 shrink-0">
        {comment.user.imageUrl && (
          <AvatarImage
            src={comment.user.imageUrl}
            alt={
              [comment.user.firstName, comment.user.lastName]
                .filter(Boolean)
                .join(" ") || ""
            }
          />
        )}
        <AvatarFallback>
          {(comment.user.firstName ?? comment.user.username ?? "?")
            .slice(0, 2)
            .toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 text-sm">
          <Link
            href={`/admin/users/${comment.user.id}`}
            className="font-medium hover:underline"
          >
            {[comment.user.firstName, comment.user.lastName]
              .filter(Boolean)
              .join(" ") ||
              comment.user.username ||
              comment.user.id.slice(0, 8)}
          </Link>
          <span className="text-xs text-muted-foreground">
            {formatDateTime(comment.createdAt)}
          </span>
          {comment.updatedAt.getTime() !== comment.createdAt.getTime() && (
            <span className="text-xs text-muted-foreground">(edited)</span>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              className="w-full min-h-[60px] rounded border px-3 py-2 text-sm resize-y bg-background"
              maxLength={2000}
              autoFocus
            />
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                disabled={!editBody.trim() || updatePending}
                onClick={onSubmitEdit}
              >
                {updatePending ? "Saving…" : "Save"}
              </Button>
              <Button size="sm" variant="ghost" onClick={onCancelEdit}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm whitespace-pre-wrap break-words">
            {comment.body}
          </p>
        )}

        {!isEditing && (
          <div className="flex items-center gap-3 text-xs">
            <button
              type="button"
              onClick={() => onUpvote(comment.id)}
              className={`inline-flex items-center gap-1 rounded px-2 py-1 hover:bg-muted ${
                comment.viewerHasUpvoted
                  ? "text-orange-600 dark:text-orange-400 font-medium"
                  : "text-muted-foreground"
              }`}
            >
              <span aria-hidden>▲</span>
              <span>{comment.upvoteCount}</span>
            </button>
            {onStartReply && (
              <button
                type="button"
                onClick={onStartReply}
                className="text-muted-foreground hover:text-foreground"
              >
                Reply
              </button>
            )}
            <button
              type="button"
              onClick={onStartEdit}
              className="text-muted-foreground hover:text-foreground"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm("Delete this comment?")) {
                  onDelete(comment.id);
                }
              }}
              className="text-destructive hover:underline"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
