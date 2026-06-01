"use client";

import { toast } from "sonner";

import {
  ImageTooBigError,
  encodeImageForUpload,
} from "@/app/admin/_lib/encode-image";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

/**
 * Admin image-array picker. Accepts a mixed list of existing CDN URLs and
 * pending base64 payloads — uploads happen server-side when the parent
 * form submits. Used by merch (max 4) and organizations (max 10).
 *
 * Pass `uploading`/`setUploading` so the parent form can disable submit
 * while files are encoding to base64.
 */
export function ImageUploader({
  label,
  imageUrls,
  onChange,
  uploading,
  setUploading,
  maxImages,
}: {
  label: string;
  imageUrls: string[];
  onChange: (next: string[]) => void;
  uploading: boolean;
  setUploading: (v: boolean) => void;
  maxImages: number;
}) {
  const removeImage = (idx: number) =>
    onChange(imageUrls.filter((_, i) => i !== idx));

  const onPickFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = maxImages - imageUrls.length;
    const picked = Array.from(files).slice(0, remaining);
    setUploading(true);
    try {
      // Encode in series so a bad image short-circuits the rest with a clear
      // toast — Promise.all would race-reject and orphan in-flight encodes.
      // Each result is dropped if too big rather than appended to state, so
      // the user sees exactly which files made it through.
      const accepted: string[] = [];
      for (const file of picked) {
        try {
          accepted.push(await encodeImageForUpload(file));
        } catch (e) {
          if (e instanceof ImageTooBigError) {
            toast.error(`${file.name}: ${e.message}`);
            continue;
          }
          toast.error(
            `${file.name}: ${e instanceof Error ? e.message : "could not read image"}`,
          );
        }
      }
      if (accepted.length > 0) onChange([...imageUrls, ...accepted]);
    } finally {
      setUploading(false);
    }
  };

  const isImageFull = imageUrls.length >= maxImages;

  return (
    <div className="space-y-2">
      <Label>
        {label} ({imageUrls.length}/{maxImages})
      </Label>
      {imageUrls.length > 0 && (
        <ul className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {imageUrls.map((src, i) => {
            const isHttp = src.startsWith("http");
            return (
              <li
                key={`${i}-${src.slice(0, 16)}`}
                className="relative rounded border bg-muted/40 overflow-hidden"
              >
                <img
                  src={isHttp ? src : `data:image/jpeg;base64,${src}`}
                  alt=""
                  className="aspect-square w-full object-cover"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="absolute top-1 right-1 h-7 px-2"
                  onClick={() => removeImage(i)}
                >
                  ×
                </Button>
                {!isHttp && (
                  <span className="absolute bottom-1 left-1 text-[10px] bg-amber-200 text-amber-900 rounded px-1">
                    pending upload
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {!isImageFull && (
        <label
          className={`flex flex-col items-center justify-center gap-1 border-2 border-dashed border-input rounded px-4 py-6 text-sm transition-colors ${
            uploading
              ? "opacity-50 cursor-not-allowed"
              : "cursor-pointer hover:border-primary hover:bg-muted/40"
          }`}
        >
          <span className="text-2xl leading-none">＋</span>
          <span className="font-medium">
            {uploading ? "Uploading…" : "Click to add images"}
          </span>
          <span className="text-xs text-muted-foreground">
            JPG, PNG or WebP · auto-resized · up to{" "}
            {maxImages - imageUrls.length} more
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={uploading}
            onChange={(e) => {
              void onPickFiles(e.target.files);
              e.target.value = "";
            }}
            className="sr-only"
          />
        </label>
      )}
      {isImageFull && (
        <p className="text-xs text-muted-foreground">
          Max {maxImages} images. Remove one to add more.
        </p>
      )}
    </div>
  );
}
