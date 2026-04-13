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
  type AdminMountainUpdateBody,
  useAdminMountainChallenges,
  useAdminMountainDetail,
  useDeleteAdminMountain,
  useUpdateAdminMountain,
} from "@/domains/admin/api";

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
  const update = useUpdateAdminMountain(id);
  const deleteMountain = useDeleteAdminMountain(id);

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
          <dd>{new Date(m.createdAt).toLocaleDateString()}</dd>
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
          <ul className="divide-y border rounded-md">
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
