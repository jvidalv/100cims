"use client";

import { useState } from "react";

import { MERCH_SIZES } from "@/api/lib/merch-sizes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MAX_IMAGES = 4;
const FEATURED_OPTIONS = ["none", "1", "2", "3", "4", "5"] as const;

export type MerchVariantFormValue = {
  color: string;
  imageUrls: string[];
};

export type MerchFormValues = {
  slug: string;
  nameEn: string;
  nameCa: string;
  nameEs: string;
  descriptionEn: string;
  descriptionCa: string;
  descriptionEs: string;
  shopUrl: string;
  price: number;
  discountedPrice: number | null;
  sizes: string[];
  featured: number | null;
  active: boolean;
  imageUrls: string[];
  variants: MerchVariantFormValue[];
};

export const emptyMerchForm: MerchFormValues = {
  slug: "",
  nameEn: "",
  nameCa: "",
  nameEs: "",
  descriptionEn: "",
  descriptionCa: "",
  descriptionEs: "",
  shopUrl: "",
  price: 0,
  discountedPrice: null,
  sizes: [],
  featured: null,
  active: true,
  imageUrls: [],
  variants: [],
};

const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string")
        return reject(new Error("Unexpected reader result"));
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

export function MerchForm({
  initial,
  saving,
  saveLabel,
  onSubmitForm,
  slugLocked = false,
}: {
  initial: MerchFormValues;
  saving: boolean;
  saveLabel: string;
  onSubmitForm: (values: MerchFormValues) => void;
  slugLocked?: boolean;
}) {
  const [form, setForm] = useState<MerchFormValues>(initial);
  const [uploading, setUploading] = useState(false);

  const discountInvalid =
    form.discountedPrice != null &&
    (form.discountedPrice <= 0 || form.discountedPrice >= form.price);

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Slug</Label>
          <Input
            value={form.slug}
            disabled={slugLocked}
            onChange={(e) =>
              setForm((f) => ({ ...f, slug: e.target.value.trim() }))
            }
            placeholder="white-shirt"
          />
        </div>
        <div className="space-y-1">
          <Label>Price (€)</Label>
          <Input
            type="number"
            min={0}
            value={form.price}
            onChange={(e) =>
              setForm((f) => ({ ...f, price: Number(e.target.value) }))
            }
          />
        </div>
        <div className="space-y-1">
          <Label>Discounted price (€, optional)</Label>
          <Input
            type="number"
            min={0}
            value={form.discountedPrice ?? ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                discountedPrice:
                  e.target.value === "" ? null : Number(e.target.value),
              }))
            }
            placeholder="Leave empty for no discount"
          />
          {discountInvalid && (
            <p className="text-xs text-red-500">
              Must be greater than 0 and lower than the regular price.
            </p>
          )}
        </div>
        <div className="space-y-1">
          <Label>Featured slot</Label>
          <Select
            value={form.featured == null ? "none" : String(form.featured)}
            onValueChange={(v) =>
              setForm((f) => ({
                ...f,
                featured: v === "none" ? null : Number(v),
              }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FEATURED_OPTIONS.map((o) => (
                <SelectItem key={o} value={o}>
                  {o === "none" ? "Not featured" : `Slot ${o}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <LocaleField
        label="Name"
        required
        en={form.nameEn}
        ca={form.nameCa}
        es={form.nameEs}
        onChange={(loc, v) =>
          setForm((f) => ({
            ...f,
            ...(loc === "en"
              ? { nameEn: v }
              : loc === "ca"
                ? { nameCa: v }
                : { nameEs: v }),
          }))
        }
      />

      <LocaleField
        label="Description"
        multiline
        en={form.descriptionEn}
        ca={form.descriptionCa}
        es={form.descriptionEs}
        onChange={(loc, v) =>
          setForm((f) => ({
            ...f,
            ...(loc === "en"
              ? { descriptionEn: v }
              : loc === "ca"
                ? { descriptionCa: v }
                : { descriptionEs: v }),
          }))
        }
      />

      <div className="space-y-1">
        <Label>Shop URL</Label>
        <Input
          value={form.shopUrl}
          onChange={(e) => setForm((f) => ({ ...f, shopUrl: e.target.value }))}
          placeholder="https://shop.example.com/product"
        />
      </div>

      <div className="space-y-2">
        <Label>Sizes</Label>
        <div className="flex flex-wrap gap-3">
          {MERCH_SIZES.map((size) => {
            const checked = form.sizes.includes(size);
            return (
              <label
                key={size}
                className="flex items-center gap-1.5 text-sm cursor-pointer select-none rounded border px-2.5 py-1 hover:bg-muted/40"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      sizes: e.target.checked
                        ? Array.from(new Set([...f.sizes, size]))
                        : f.sizes.filter((s) => s !== size),
                    }))
                  }
                />
                <span>{size}</span>
              </label>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          Leave empty for products without sizes (mugs, stickers, …).
        </p>
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) =>
              setForm((f) => ({ ...f, active: e.target.checked }))
            }
          />
          <span>Active (visible in app)</span>
        </label>
      </div>

      <ImageUploader
        label="Images"
        imageUrls={form.imageUrls}
        onChange={(next) => setForm((f) => ({ ...f, imageUrls: next }))}
        uploading={uploading}
        setUploading={setUploading}
      />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Color variants</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setForm((f) => ({
                ...f,
                variants: [...f.variants, { color: "", imageUrls: [] }],
              }))
            }
          >
            + Add color
          </Button>
        </div>
        {form.variants.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Add colors like "black" or "white" with their own images. Hidden
            when fewer than 2 variants exist.
          </p>
        )}
        {form.variants.map((v, idx) => (
          <div
            key={idx}
            className="space-y-2 rounded border border-input bg-muted/20 p-3"
          >
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1">
                <Label>Color token</Label>
                <Input
                  value={v.color}
                  placeholder="black"
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      variants: f.variants.map((x, i) =>
                        i === idx
                          ? { ...x, color: e.target.value.trim().toLowerCase() }
                          : x,
                      ),
                    }))
                  }
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    variants: f.variants.filter((_, i) => i !== idx),
                  }))
                }
              >
                Remove
              </Button>
            </div>
            <ImageUploader
              label="Variant images"
              imageUrls={v.imageUrls}
              onChange={(next) =>
                setForm((f) => ({
                  ...f,
                  variants: f.variants.map((x, i) =>
                    i === idx ? { ...x, imageUrls: next } : x,
                  ),
                }))
              }
              uploading={uploading}
              setUploading={setUploading}
            />
          </div>
        ))}
      </div>

      {(() => {
        const colors = form.variants.map((v) => v.color);
        const hasDuplicates = colors.length !== new Set(colors).size;
        const hasEmpty = form.variants.some((v) => !v.color);
        if (hasDuplicates || hasEmpty) {
          return (
            <p className="text-xs text-red-500">
              {hasEmpty
                ? "Every variant needs a color token."
                : "Duplicate color tokens are not allowed."}
            </p>
          );
        }
        return null;
      })()}

      <div className="flex items-center gap-3 pt-2">
        <Button
          disabled={
            saving ||
            uploading ||
            !form.slug ||
            !form.nameEn ||
            form.price < 0 ||
            discountInvalid ||
            form.variants.some((v) => !v.color) ||
            form.variants.length !==
              new Set(form.variants.map((v) => v.color)).size
          }
          onClick={() => onSubmitForm(form)}
        >
          {saving ? "Saving…" : saveLabel}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={saving}
          onClick={() => setForm(initial)}
        >
          Reset
        </Button>
      </div>
    </div>
  );
}

type Loc = "en" | "ca" | "es";

function LocaleField({
  label,
  required,
  multiline,
  en,
  ca,
  es,
  onChange,
}: {
  label: string;
  required?: boolean;
  multiline?: boolean;
  en: string;
  ca: string;
  es: string;
  onChange: (loc: Loc, value: string) => void;
}) {
  const fields: { loc: Loc; value: string; req: boolean }[] = [
    { loc: "en", value: en, req: !!required },
    { loc: "ca", value: ca, req: false },
    { loc: "es", value: es, req: false },
  ];
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="space-y-2">
        {fields.map(({ loc, value, req }) => (
          <div key={loc} className="flex items-start gap-2">
            <span className="mt-2 inline-flex items-center justify-center w-9 h-7 text-xs font-mono uppercase rounded bg-muted shrink-0">
              {loc}
            </span>
            {multiline ? (
              <textarea
                value={value}
                rows={3}
                onChange={(e) => onChange(loc, e.target.value)}
                placeholder={req ? "Required" : ""}
                className="flex w-full rounded border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            ) : (
              <Input
                value={value}
                onChange={(e) => onChange(loc, e.target.value)}
                placeholder={req ? "Required" : ""}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ImageUploader({
  label,
  imageUrls,
  onChange,
  uploading,
  setUploading,
}: {
  label: string;
  imageUrls: string[];
  onChange: (next: string[]) => void;
  uploading: boolean;
  setUploading: (v: boolean) => void;
}) {
  const removeImage = (idx: number) =>
    onChange(imageUrls.filter((_, i) => i !== idx));

  const onPickFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = MAX_IMAGES - imageUrls.length;
    const picked = Array.from(files).slice(0, remaining);
    setUploading(true);
    try {
      const next = await Promise.all(picked.map(fileToBase64));
      onChange([...imageUrls, ...next]);
    } finally {
      setUploading(false);
    }
  };

  const isImageFull = imageUrls.length >= MAX_IMAGES;

  return (
    <div className="space-y-2">
      <Label>
        {label} ({imageUrls.length}/{MAX_IMAGES})
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
            JPG, PNG or WebP · up to {MAX_IMAGES - imageUrls.length} more
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
          Max {MAX_IMAGES} images. Remove one to add more.
        </p>
      )}
    </div>
  );
}
