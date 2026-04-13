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
  type AdminSummitUpdateBody,
  useAdminSummitDetail,
  useDeleteAdminSummit,
  useUpdateAdminSummit,
} from "@/domains/admin/api";

type Form = {
  summitedAt: string;
  validated: boolean;
  imageUrl: string;
  mountainId: string;
  userId: string;
};

const emptyForm: Form = {
  summitedAt: "",
  validated: true,
  imageUrl: "",
  mountainId: "",
  userId: "",
};

export default function AdminSummitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const detail = useAdminSummitDetail(id);
  const update = useUpdateAdminSummit(id);
  const deleteSummit = useDeleteAdminSummit(id);

  const onDelete = () =>
    deleteSummit.mutate(undefined, {
      onSuccess: () => {
        toast.success("Summit deleted");
        router.push("/admin/summits");
      },
      onError: (e) =>
        toast.error(e instanceof Error ? e.message : "Delete failed"),
    });

  const [form, setForm] = useState<Form>(emptyForm);
  const [initial, setInitial] = useState<Form>(emptyForm);

  useEffect(() => {
    if (!detail.data || update.isPending) return;
    const next: Form = {
      summitedAt: detail.data.summitedAt,
      validated: detail.data.validated,
      imageUrl: detail.data.imageUrl,
      mountainId: detail.data.mountainId ?? "",
      userId: detail.data.userId ?? "",
    };
    setForm(next);
    setInitial(next);
  }, [detail.data, update.isPending]);

  const dirty = (Object.keys(form) as (keyof Form)[]).some(
    (k) => form[k] !== initial[k],
  );

  const onSave = () => {
    const body: AdminSummitUpdateBody = {};
    if (form.summitedAt !== initial.summitedAt)
      body.summitedAt = form.summitedAt;
    if (form.validated !== initial.validated) body.validated = form.validated;
    if (form.imageUrl !== initial.imageUrl) body.imageUrl = form.imageUrl;
    if (form.mountainId !== initial.mountainId)
      body.mountainId = form.mountainId || null;
    if (form.userId !== initial.userId) body.userId = form.userId || null;

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
          href="/admin/summits"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Summits
        </Link>
        <p className="text-red-600">
          {detail.error?.message ?? "Summit not found"}
        </p>
      </div>
    );
  }

  const s = detail.data;
  const mainUserName =
    [s.userFirstName, s.userLastName].filter(Boolean).join(" ") ||
    s.userUsername ||
    "—";

  return (
    <div className="p-8 space-y-8">
      <div className="space-y-1">
        <Link
          href="/admin/summits"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Summits
        </Link>
        <div className="flex items-center gap-4 mt-2">
          <Avatar className="size-16 rounded-md">
            <AvatarImage
              src={s.imageUrl}
              alt="summit"
              className="object-cover"
            />
            <AvatarFallback className="rounded-md text-lg">🏔</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold leading-tight">
              {s.mountainName ?? "Unknown mountain"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {new Date(s.summitedAt).toLocaleDateString()} · {mainUserName}
            </p>
          </div>
        </div>
      </div>

      <section className="space-y-4 max-w-2xl">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Edit
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldText
            label="Summited at (YYYY-MM-DD)"
            value={form.summitedAt}
            onChange={(v) => setForm((p) => ({ ...p, summitedAt: v }))}
            placeholder="2025-08-15"
          />
          <FieldText
            label="Mountain ID"
            value={form.mountainId}
            onChange={(v) => setForm((p) => ({ ...p, mountainId: v }))}
          />
          <FieldText
            label="Main user ID"
            value={form.userId}
            onChange={(v) => setForm((p) => ({ ...p, userId: v }))}
          />
          <div className="md:col-span-2">
            <FieldText
              label="Image URL"
              value={form.imageUrl}
              onChange={(v) => setForm((p) => ({ ...p, imageUrl: v }))}
              placeholder="https://bucket.s3.…/summit.jpg"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.validated}
            onChange={(e) =>
              setForm((p) => ({ ...p, validated: e.target.checked }))
            }
          />
          <span>Validated</span>
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
          <dt className="text-muted-foreground">Mountain</dt>
          <dd>
            {s.mountainId && s.mountainName ? (
              <Link
                href={`/admin/mountains/${s.mountainId}`}
                className="hover:underline"
              >
                {s.mountainName}
                {s.mountainHeight && (
                  <span className="text-muted-foreground">
                    {" "}
                    · {s.mountainHeight} m
                  </span>
                )}
              </Link>
            ) : (
              "—"
            )}
          </dd>
          <dt className="text-muted-foreground">Main user</dt>
          <dd>
            {s.userId ? (
              <Link
                href={`/admin/users/${s.userId}`}
                className="hover:underline"
              >
                {mainUserName}
              </Link>
            ) : (
              "—"
            )}
          </dd>
          <dt className="text-muted-foreground">Created</dt>
          <dd>{new Date(s.createdAt).toLocaleString()}</dd>
        </dl>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Related users ({s.relatedUsers.length})
        </h2>
        {s.relatedUsers.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No users linked to this summit.
          </p>
        ) : (
          <ul className="divide-y border rounded-md">
            {s.relatedUsers.map((u) => {
              const name =
                [u.firstName, u.lastName].filter(Boolean).join(" ") ||
                u.username;
              const initials = name.slice(0, 2).toUpperCase();
              return (
                <li key={u.id} className="flex items-center gap-3 px-4 py-3">
                  <Avatar className="size-8">
                    {u.imageUrl && <AvatarImage src={u.imageUrl} alt={name} />}
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <Link
                    href={`/admin/users/${u.id}`}
                    className="font-medium hover:underline"
                  >
                    {name}
                  </Link>
                  {u.isMain && (
                    <span className="inline-flex items-center rounded-md bg-sky-100 text-sky-900 dark:bg-sky-900/30 dark:text-sky-300 px-2 py-0.5 text-xs font-medium">
                      Main
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-3 max-w-2xl pt-4 border-t border-destructive/30">
        <h2 className="text-sm font-medium text-destructive uppercase tracking-wide">
          Danger zone
        </h2>
        <p className="text-sm text-muted-foreground">
          Deleting this summit removes it and every user&apos;s record of it.
          This cannot be undone.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={deleteSummit.isPending}>
              Delete summit
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this summit?</AlertDialogTitle>
              <AlertDialogDescription>
                This removes the summit and every user&apos;s record of it.
                Cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={onDelete}
              >
                {deleteSummit.isPending ? "Deleting…" : "Delete"}
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
