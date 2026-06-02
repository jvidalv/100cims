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
import { MAX_ORGANIZATION_PHOTOS } from "@/api/lib/organization-images";
import {
  ImageTooBigError,
  encodeImageForUpload,
} from "@/app/admin/_lib/encode-image";
import { ImageUploader } from "@/app/admin/_lib/image-uploader";
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
  instagramUrl: string;
  tiktokUrl: string;
  whatsappUrl: string;
  youtubeUrl: string;
  stravaUrl: string;
};

const emptyForm: Form = {
  name: "",
  description: "",
  websiteUrl: "",
  imageUrl: "",
  instagramUrl: "",
  tiktokUrl: "",
  whatsappUrl: "",
  youtubeUrl: "",
  stravaUrl: "",
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
  // Showcase gallery is tracked separately so the existing string-keyed
  // dirty check on `form` keeps working — comparing string[] with `!==`
  // would always be dirty after a re-render.
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [initialPhotoUrls, setInitialPhotoUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const onPickImage = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const base64 = await encodeImageForUpload(file);
      setForm((f) => ({ ...f, imageUrl: base64 }));
    } catch (e) {
      if (e instanceof ImageTooBigError) {
        toast.error(e.message);
      } else {
        toast.error(
          e instanceof Error ? e.message : "Could not read that image",
        );
      }
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
      instagramUrl: detail.data.instagramUrl ?? "",
      tiktokUrl: detail.data.tiktokUrl ?? "",
      whatsappUrl: detail.data.whatsappUrl ?? "",
      youtubeUrl: detail.data.youtubeUrl ?? "",
      stravaUrl: detail.data.stravaUrl ?? "",
    };
    setForm(next);
    setInitial(next);
    const nextPhotos = detail.data.photoUrls;
    setPhotoUrls(nextPhotos);
    setInitialPhotoUrls(nextPhotos);
  }, [detail.data, update.isPending]);

  const dirty =
    (Object.keys(form) as (keyof Form)[]).some((k) => form[k] !== initial[k]) ||
    photoUrls.length !== initialPhotoUrls.length ||
    photoUrls.some((u, i) => u !== initialPhotoUrls[i]);

  const onSave = () => {
    const body: AdminOrganizationUpdateBody = {};
    if (form.name !== initial.name) body.name = form.name;
    if (form.description !== initial.description)
      body.description = form.description || null;
    if (form.websiteUrl !== initial.websiteUrl)
      body.websiteUrl = form.websiteUrl || null;
    if (form.imageUrl !== initial.imageUrl)
      body.imageUrl = form.imageUrl || null;
    if (form.instagramUrl !== initial.instagramUrl)
      body.instagramUrl = form.instagramUrl || null;
    if (form.tiktokUrl !== initial.tiktokUrl)
      body.tiktokUrl = form.tiktokUrl || null;
    if (form.whatsappUrl !== initial.whatsappUrl)
      body.whatsappUrl = form.whatsappUrl || null;
    if (form.youtubeUrl !== initial.youtubeUrl)
      body.youtubeUrl = form.youtubeUrl || null;
    if (form.stravaUrl !== initial.stravaUrl)
      body.stravaUrl = form.stravaUrl || null;
    if (
      photoUrls.length !== initialPhotoUrls.length ||
      photoUrls.some((u, i) => u !== initialPhotoUrls[i])
    ) {
      body.photoUrls = photoUrls;
    }

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Instagram URL</Label>
            <Input
              value={form.instagramUrl}
              onChange={(e) =>
                setForm((f) => ({ ...f, instagramUrl: e.target.value }))
              }
              placeholder="https://instagram.com/…"
            />
          </div>
          <div className="space-y-1">
            <Label>TikTok URL</Label>
            <Input
              value={form.tiktokUrl}
              onChange={(e) =>
                setForm((f) => ({ ...f, tiktokUrl: e.target.value }))
              }
              placeholder="https://tiktok.com/@…"
            />
          </div>
          <div className="space-y-1">
            <Label>WhatsApp URL</Label>
            <Input
              value={form.whatsappUrl}
              onChange={(e) =>
                setForm((f) => ({ ...f, whatsappUrl: e.target.value }))
              }
              placeholder="https://chat.whatsapp.com/…"
            />
          </div>
          <div className="space-y-1">
            <Label>YouTube URL</Label>
            <Input
              value={form.youtubeUrl}
              onChange={(e) =>
                setForm((f) => ({ ...f, youtubeUrl: e.target.value }))
              }
              placeholder="https://youtube.com/@…"
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label>Strava URL</Label>
            <Input
              value={form.stravaUrl}
              onChange={(e) =>
                setForm((f) => ({ ...f, stravaUrl: e.target.value }))
              }
              placeholder="https://strava.com/clubs/…"
            />
          </div>
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
                JPG, PNG or WebP · auto-resized · max {MAX_IMAGE_KB} KB
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

        <ImageUploader
          label="Showcase photos"
          imageUrls={photoUrls}
          onChange={setPhotoUrls}
          uploading={uploading}
          setUploading={setUploading}
          maxImages={MAX_ORGANIZATION_PHOTOS}
        />

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
              onClick={() => {
                setForm(initial);
                setPhotoUrls(initialPhotoUrls);
              }}
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
            const initials = (u.firstName?.[0] ?? u.email[0]).toUpperCase();
            return (
              <div className="flex w-full items-center gap-3">
                <Avatar className="size-8 shrink-0">
                  {u.imageUrl && <AvatarImage src={u.imageUrl} alt={name} />}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start gap-0.5 min-w-0">
                  <span className="font-medium truncate">{name}</span>
                  {u.email && (
                    <span className="text-xs text-muted-foreground truncate">
                      {u.email}
                    </span>
                  )}
                </div>
              </div>
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
