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
import { MAX_IMAGE_KB } from "@/api/lib/images";
import { fileToBase64 } from "@/app/admin/_lib/file-to-base64";
import { SearchPicker } from "@/app/admin/_lib/search-picker";
import { useUserSearch } from "@/app/admin/_lib/use-user-search";
import {
  type AdminOrganizationUpdateBody,
  useAddAdminOrganizationMember,
  useAdminOrganizationDetail,
  useDeleteAdminOrganization,
  useRemoveAdminOrganizationMember,
  useUpdateAdminOrganization,
} from "@/domains/admin/api";
import { formatDate, formatDateTime } from "@/lib/format-date";

type Form = {
  name: string;
  description: string;
  websiteUrl: string;
  imageUrl: string;
};

const emptyForm: Form = {
  name: "",
  description: "",
  websiteUrl: "",
  imageUrl: "",
};

export default function AdminOrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const detail = useAdminOrganizationDetail(id);
  const update = useUpdateAdminOrganization(id);
  const deleteOrg = useDeleteAdminOrganization(id);
  const addMember = useAddAdminOrganizationMember(id);
  const removeMember = useRemoveAdminOrganizationMember(id);

  const [form, setForm] = useState<Form>(emptyForm);
  const [initial, setInitial] = useState<Form>(emptyForm);
  const [uploading, setUploading] = useState(false);

  const onPickImage = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const base64 = await fileToBase64(file);
      // base64 byte count = ceil(len * 3 / 4); good enough as a client-side
      // guard. Server re-validates with isBase64SizeValid().
      const sizeKB = Math.ceil((base64.length * 3) / 4 / 1024);
      if (sizeKB > MAX_IMAGE_KB) {
        toast.error(`Image too large (${sizeKB} KB · max ${MAX_IMAGE_KB} KB)`);
        return;
      }
      setForm((f) => ({ ...f, imageUrl: base64 }));
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (!detail.data || update.isPending) return;
    const next: Form = {
      name: detail.data.name,
      description: detail.data.description ?? "",
      websiteUrl: detail.data.websiteUrl ?? "",
      imageUrl: detail.data.imageUrl ?? "",
    };
    setForm(next);
    setInitial(next);
  }, [detail.data, update.isPending]);

  const dirty = (Object.keys(form) as (keyof Form)[]).some(
    (k) => form[k] !== initial[k],
  );

  const onSave = () => {
    const body: AdminOrganizationUpdateBody = {};
    if (form.name !== initial.name) body.name = form.name;
    if (form.description !== initial.description)
      body.description = form.description || null;
    if (form.websiteUrl !== initial.websiteUrl)
      body.websiteUrl = form.websiteUrl || null;
    if (form.imageUrl !== initial.imageUrl)
      body.imageUrl = form.imageUrl || null;

    update.mutate(body, {
      onSuccess: () => toast.success("Saved"),
      onError: (e) =>
        toast.error(e instanceof Error ? e.message : "Update failed"),
    });
  };

  const onDelete = () =>
    deleteOrg.mutate(undefined, {
      onSuccess: () => {
        toast.success("Organization deleted");
        router.push("/admin/organizations");
      },
      onError: (e) =>
        toast.error(e instanceof Error ? e.message : "Delete failed"),
    });

  const onRemoveMember = (userId: string, name: string) => {
    if (!window.confirm(`Remove ${name} from this organization?`)) return;
    removeMember.mutate(userId, {
      onSuccess: () => toast.success("Member removed"),
      onError: (e) =>
        toast.error(e instanceof Error ? e.message : "Remove failed"),
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
          href="/admin/organizations"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Organizations
        </Link>
        <p className="text-red-600">
          {detail.error?.message ?? "Organization not found"}
        </p>
      </div>
    );
  }

  const o = detail.data;
  const memberIdSet = new Set(o.members.map((m) => m.userId));

  return (
    <div className="p-8 space-y-8">
      <div className="space-y-1">
        <Link
          href="/admin/organizations"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Organizations
        </Link>
        <div className="flex items-center gap-4 mt-2">
          {o.imageUrl ? (
            <img
              src={o.imageUrl}
              alt=""
              className="size-16 rounded object-cover"
            />
          ) : (
            <div className="size-16 rounded bg-muted flex items-center justify-center text-2xl">
              🏔️
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-2xl font-bold leading-tight truncate">
              {o.name}
            </h1>
            {o.websiteUrl && (
              <a
                href={o.websiteUrl}
                target="_blank"
                rel="noopener"
                className="text-sm text-muted-foreground hover:underline"
              >
                {o.websiteUrl}
              </a>
            )}
          </div>
        </div>
      </div>

      <section className="space-y-4 max-w-2xl">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Edit
        </h2>
        <div className="space-y-1">
          <Label>Name</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>
        <div className="space-y-1">
          <Label>Description</Label>
          <textarea
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            rows={4}
            className="flex w-full rounded border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <div className="space-y-1">
          <Label>Website URL</Label>
          <Input
            value={form.websiteUrl}
            onChange={(e) =>
              setForm((f) => ({ ...f, websiteUrl: e.target.value }))
            }
            placeholder="https://…"
          />
        </div>
        <div className="space-y-2">
          <Label>Image</Label>
          {form.imageUrl ? (
            <div className="flex items-start gap-3">
              <img
                src={
                  form.imageUrl.startsWith("http")
                    ? form.imageUrl
                    : `data:image/jpeg;base64,${form.imageUrl}`
                }
                alt=""
                className="size-32 rounded object-cover border"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setForm((f) => ({ ...f, imageUrl: "" }))}
              >
                Remove
              </Button>
            </div>
          ) : (
            <label
              className={`flex flex-col items-center justify-center gap-1 border-2 border-dashed border-input rounded px-4 py-6 text-sm transition-colors ${
                uploading
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer hover:border-primary hover:bg-muted/40"
              }`}
            >
              <span className="text-2xl leading-none">＋</span>
              <span className="font-medium">
                {uploading ? "Reading…" : "Click to add an image"}
              </span>
              <span className="text-xs text-muted-foreground">
                JPG, PNG or WebP · max {MAX_IMAGE_KB} KB
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={uploading}
                onChange={(e) => {
                  void onPickImage(e.target.files?.[0] ?? null);
                  // Reset so re-picking the same file fires onChange again.
                  e.target.value = "";
                }}
                className="sr-only"
              />
            </label>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button
            disabled={!dirty || update.isPending || uploading}
            onClick={onSave}
          >
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
          <dt className="text-muted-foreground">Created</dt>
          <dd>{formatDateTime(o.createdAt)}</dd>
          <dt className="text-muted-foreground">Updated</dt>
          <dd>{formatDateTime(o.updatedAt)}</dd>
        </dl>
      </section>

      <section className="space-y-3 max-w-3xl">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Members ({o.members.length})
        </h2>
        {o.members.length === 0 ? (
          <p className="text-muted-foreground text-sm">No members yet.</p>
        ) : (
          <ul className="divide-y border rounded">
            {o.members.map((m) => {
              const name =
                [m.firstName, m.lastName].filter(Boolean).join(" ") || "—";
              const initials = name.slice(0, 2).toUpperCase();
              return (
                <li
                  key={m.userId}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <Link
                    href={`/admin/users/${m.userId}`}
                    className="flex items-center gap-3 flex-1 min-w-0 hover:underline"
                  >
                    <Avatar className="size-8">
                      {m.imageUrl && (
                        <AvatarImage src={m.imageUrl} alt={name} />
                      )}
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium truncate">{name}</span>
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(m.joinedAt)}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={removeMember.isPending}
                    onClick={() => onRemoveMember(m.userId, name)}
                  >
                    Remove
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
        <SearchPicker
          placeholder="Add a member by name or email…"
          emptyLabel="No users match."
          useResults={useUserSearch}
          excludeIds={memberIdSet}
          onPick={(u) =>
            addMember.mutate(
              { userId: u.id },
              {
                onSuccess: () => toast.success("Member added"),
                onError: (e) =>
                  toast.error(e instanceof Error ? e.message : "Add failed"),
              },
            )
          }
          renderOption={(u) => {
            const name =
              [u.firstName, u.lastName].filter(Boolean).join(" ") ||
              u.username ||
              u.email;
            return (
              <>
                <span className="font-medium">{name}</span>
                {u.email && (
                  <span className="text-xs text-muted-foreground">
                    {u.email}
                  </span>
                )}
              </>
            );
          }}
        />
      </section>

      <section className="space-y-3 max-w-2xl pt-4 border-t border-destructive/30">
        <h2 className="text-sm font-medium text-destructive uppercase tracking-wide">
          Danger zone
        </h2>
        <p className="text-sm text-muted-foreground">
          Deleting this organization removes its memberships. Plans hosted by
          this organization are kept, but their `organizationId` is set to null.
          This cannot be undone.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={deleteOrg.isPending}>
              Delete organization
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this organization?</AlertDialogTitle>
              <AlertDialogDescription>
                This removes the organization and all its memberships. Plans
                hosted by it stay alive but become unaffiliated. Cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={onDelete}
              >
                {deleteOrg.isPending ? "Deleting…" : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </div>
  );
}
