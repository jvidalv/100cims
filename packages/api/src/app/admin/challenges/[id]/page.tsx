"use client";

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
  type AdminChallengeUpdateBody,
  useAdminChallengeDetail,
  useAdminChallengeMountains,
  useDeleteAdminChallenge,
  useUpdateAdminChallenge,
} from "@/domains/admin/api";

type Form = {
  name: string;
  country: string;
  description: string;
  emoji: string;
  imageUrl: string;
  webUrl: string;
  isPublic: boolean;
};

const emptyForm: Form = {
  name: "",
  country: "",
  description: "",
  emoji: "",
  imageUrl: "",
  webUrl: "",
  isPublic: true,
};

export default function AdminChallengeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const detail = useAdminChallengeDetail(id);
  const mountains = useAdminChallengeMountains(id);
  const update = useUpdateAdminChallenge(id);
  const deleteChallenge = useDeleteAdminChallenge(id);

  const onDelete = () =>
    deleteChallenge.mutate(undefined, {
      onSuccess: () => {
        toast.success("Challenge deleted");
        router.push("/admin/challenges");
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
      country: detail.data.country,
      description: detail.data.description ?? "",
      emoji: detail.data.emoji ?? "",
      imageUrl: detail.data.imageUrl ?? "",
      webUrl: detail.data.webUrl ?? "",
      isPublic: detail.data.isPublic,
    };
    setForm(next);
    setInitial(next);
  }, [detail.data, update.isPending]);

  const dirty = (Object.keys(form) as (keyof Form)[]).some(
    (k) => form[k] !== initial[k],
  );

  const onSave = () => {
    const body: AdminChallengeUpdateBody = {};
    if (form.name !== initial.name) body.name = form.name;
    if (form.country !== initial.country) body.country = form.country;
    if (form.description !== initial.description)
      body.description = form.description || null;
    if (form.emoji !== initial.emoji) body.emoji = form.emoji || null;
    if (form.imageUrl !== initial.imageUrl)
      body.imageUrl = form.imageUrl || null;
    if (form.webUrl !== initial.webUrl) body.webUrl = form.webUrl || null;
    if (form.isPublic !== initial.isPublic) body.isPublic = form.isPublic;

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
          href="/admin/challenges"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Challenges
        </Link>
        <p className="text-red-600">
          {detail.error?.message ?? "Challenge not found"}
        </p>
      </div>
    );
  }

  const c = detail.data;

  return (
    <div className="p-8 space-y-8">
      <div className="space-y-1">
        <Link
          href="/admin/challenges"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Challenges
        </Link>
        <div className="flex items-center gap-3 mt-2">
          <div
            className="size-12 rounded-md flex items-center justify-center text-2xl"
            style={{ backgroundColor: "#BAE1FF", color: "black" }}
          >
            {c.emoji || "🏔️"}
          </div>
          <div>
            <h1 className="text-2xl font-bold leading-tight">{c.name}</h1>
            <p className="text-sm text-muted-foreground font-mono">{c.slug}</p>
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
            label="Country (ISO code)"
            value={form.country}
            onChange={(v) => setForm((p) => ({ ...p, country: v }))}
            placeholder="ES"
          />
          <FieldText
            label="Emoji"
            value={form.emoji}
            onChange={(v) => setForm((p) => ({ ...p, emoji: v }))}
            placeholder="🏔️"
          />
          <FieldText
            label="External URL"
            value={form.webUrl}
            onChange={(v) => setForm((p) => ({ ...p, webUrl: v }))}
            placeholder="https://…"
          />
          <div className="md:col-span-2">
            <FieldText
              label="Image URL"
              value={form.imageUrl}
              onChange={(v) => setForm((p) => ({ ...p, imageUrl: v }))}
              placeholder="https://bucket.s3.…/challenge.jpg"
            />
          </div>
          <div className="md:col-span-2 space-y-1">
            <Label>Description</Label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              rows={4}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.isPublic}
            onChange={(e) =>
              setForm((p) => ({ ...p, isPublic: e.target.checked }))
            }
          />
          <span>Public</span>
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
          <dt className="text-muted-foreground">Slug</dt>
          <dd className="font-mono">{c.slug}</dd>
          <dt className="text-muted-foreground">Kind</dt>
          <dd>
            <Badge
              variant={c.isOfficial ? "neutral" : "sky"}
              label={c.isOfficial ? "Official" : "Community"}
            />
          </dd>
          <dt className="text-muted-foreground">Creator</dt>
          <dd>{c.isOfficial ? "Official" : (c.creatorName ?? "—")}</dd>
          <dt className="text-muted-foreground">Created</dt>
          <dd>{new Date(c.createdAt).toLocaleDateString()}</dd>
        </dl>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Mountains {mountains.data ? `(${mountains.data.length})` : ""}
        </h2>

        {mountains.error && (
          <p className="text-red-600">{mountains.error.message}</p>
        )}
        {mountains.isLoading && !mountains.data && (
          <p className="text-muted-foreground">Loading…</p>
        )}

        {mountains.data && mountains.data.length === 0 && (
          <p className="text-muted-foreground">
            This challenge has no mountains.
          </p>
        )}

        {mountains.data && mountains.data.length > 0 && (
          <ul className="divide-y border rounded-md">
            {mountains.data.map((m) => {
              const initials = m.name.slice(0, 2).toUpperCase();
              return (
                <li key={m.id}>
                  <Link
                    href={`/admin/mountains/${m.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40"
                  >
                    <Avatar className="size-8">
                      {m.imageUrl && (
                        <AvatarImage src={m.imageUrl} alt={m.name} />
                      )}
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{m.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {m.location}
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground font-mono">
                      {m.height} m
                    </span>
                    {m.essential && <Badge variant="amber" label="Essential" />}
                    <Badge
                      variant={m.isOfficial ? "neutral" : "sky"}
                      label={m.isOfficial ? "Official" : "Custom"}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {!c.isOfficial && (
        <section className="space-y-3 max-w-2xl pt-4 border-t border-destructive/30">
          <h2 className="text-sm font-medium text-destructive uppercase tracking-wide">
            Danger zone
          </h2>
          <p className="text-sm text-muted-foreground">
            Deleting this challenge removes it and unlinks its mountains. The
            mountains themselves are kept. This cannot be undone.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={deleteChallenge.isPending}
              >
                Delete challenge
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {c.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This deletes the challenge and unlinks every mountain from it.
                  The mountains themselves are kept. Cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={onDelete}
                >
                  {deleteChallenge.isPending ? "Deleting…" : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </section>
      )}
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

const BADGE_STYLES = {
  neutral: "bg-muted text-foreground",
  sky: "bg-sky-100 text-sky-900 dark:bg-sky-900/30 dark:text-sky-300",
  green: "bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-300",
  amber: "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-300",
} as const;

function Badge({
  label,
  variant,
}: {
  label: string;
  variant: keyof typeof BADGE_STYLES;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${BADGE_STYLES[variant]}`}
    >
      {label}
    </span>
  );
}
