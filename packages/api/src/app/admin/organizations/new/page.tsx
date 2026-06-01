"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { MAX_ORGANIZATION_PHOTOS } from "@/api/lib/organization-images";
import {
  ImageTooBigError,
  encodeImageForUpload,
} from "@/app/admin/_lib/encode-image";
import { ImageUploader } from "@/app/admin/_lib/image-uploader";
import { MAX_IMAGE_KB } from "@/api/lib/images";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateAdminOrganization } from "@/domains/admin/api";

export default function AdminOrganizationNewPage() {
  const router = useRouter();
  const create = useCreateAdminOrganization();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [stravaUrl, setStravaUrl] = useState("");
  // `imageValue` is either null, a raw base64 payload (what the API
  // uploads to S3), or an http(s) URL (already-CDN-hosted image kept
  // as-is). Mirrors the plan create/edit pattern.
  const [imageValue, setImageValue] = useState<string | null>(null);
  // Showcase gallery (1–10). Mixed list of CDN URLs (kept as-is on submit)
  // and base64 payloads (uploaded by the API). Empty by default.
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const onPickImage = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      setImageValue(await encodeImageForUpload(file));
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

  const onCreate = () => {
    create.mutate(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        websiteUrl: websiteUrl.trim() || undefined,
        imageUrl: imageValue ?? undefined,
        instagramUrl: instagramUrl.trim() || undefined,
        tiktokUrl: tiktokUrl.trim() || undefined,
        whatsappUrl: whatsappUrl.trim() || undefined,
        youtubeUrl: youtubeUrl.trim() || undefined,
        stravaUrl: stravaUrl.trim() || undefined,
        photoUrls: photoUrls.length > 0 ? photoUrls : undefined,
      },
      {
        onSuccess: ({ id }) => {
          toast.success("Organization created");
          router.push(`/admin/organizations/${id}`);
        },
        onError: (e) =>
          toast.error(e instanceof Error ? e.message : "Create failed"),
      },
    );
  };

  return (
    <div className="p-8 space-y-6">
      <Link
        href="/admin/organizations"
        className="text-sm text-muted-foreground hover:underline"
      >
        ← Organizations
      </Link>

      <h1 className="text-2xl font-bold">New organization</h1>

      <section className="space-y-4 max-w-2xl">
        <div className="space-y-1">
          <Label>Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Hiking Club X"
            autoFocus
          />
        </div>
        <div className="space-y-1">
          <Label>Description</Label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="flex w-full rounded border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            placeholder="Short blurb about the organization…"
          />
        </div>
        <div className="space-y-1">
          <Label>Website URL</Label>
          <Input
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://…"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Instagram URL</Label>
            <Input
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              placeholder="https://instagram.com/…"
            />
          </div>
          <div className="space-y-1">
            <Label>TikTok URL</Label>
            <Input
              value={tiktokUrl}
              onChange={(e) => setTiktokUrl(e.target.value)}
              placeholder="https://tiktok.com/@…"
            />
          </div>
          <div className="space-y-1">
            <Label>WhatsApp URL</Label>
            <Input
              value={whatsappUrl}
              onChange={(e) => setWhatsappUrl(e.target.value)}
              placeholder="https://chat.whatsapp.com/…"
            />
          </div>
          <div className="space-y-1">
            <Label>YouTube URL</Label>
            <Input
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://youtube.com/@…"
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label>Strava URL</Label>
            <Input
              value={stravaUrl}
              onChange={(e) => setStravaUrl(e.target.value)}
              placeholder="https://strava.com/clubs/…"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Image</Label>
          {imageValue ? (
            <div className="flex items-start gap-3">
              <img
                src={
                  imageValue.startsWith("http")
                    ? imageValue
                    : `data:image/jpeg;base64,${imageValue}`
                }
                alt=""
                className="size-32 rounded object-cover border"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setImageValue(null)}
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
            disabled={!name.trim() || create.isPending || uploading}
            onClick={onCreate}
          >
            {create.isPending ? "Creating…" : "Create"}
          </Button>
          <Link
            href="/admin/organizations"
            className="text-sm text-muted-foreground hover:underline"
          >
            Cancel
          </Link>
        </div>
      </section>
    </div>
  );
}
