"use client";

import { useEffect, useState, type ReactNode } from "react";

import type { MerchVariant } from "@/lib/merch-helpers";
import { cn } from "@/lib/utils";

const capitalize = (s: string) =>
  s.length ? s[0].toUpperCase() + s.slice(1) : s;

interface Props {
  name: string;
  defaultImages: string[];
  variants: MerchVariant[];
  colorLabel: string;
  /** Anything rendered after the color picker — typically size picker + email + submit. */
  rightColumnBelowColor: ReactNode;
  /** Rendered at the top of the right column (title, price, description). */
  rightColumnAboveColor: ReactNode;
}

export function ProductDetailClient({
  name,
  defaultImages,
  variants,
  colorLabel,
  rightColumnBelowColor,
  rightColumnAboveColor,
}: Props) {
  const [selectedColor, setSelectedColor] = useState<string | null>(
    variants[0]?.color ?? null,
  );
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [selectedColor]);

  const activeVariant = selectedColor
    ? (variants.find((v) => v.color === selectedColor) ?? null)
    : null;
  const images = activeVariant?.imageUrls.length
    ? activeVariant.imageUrls
    : defaultImages;

  const main = images[activeIndex] ?? images[0];
  const needsColor = variants.length > 1;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
      <div className="flex flex-col gap-4">
        {main ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={main}
            alt={name}
            width={1200}
            height={1200}
            fetchPriority="high"
            className="w-full aspect-square object-cover rounded-xl border"
          />
        ) : (
          <div className="w-full aspect-square bg-muted rounded-xl" />
        )}
        {images.length > 1 ? (
          <div className="grid grid-cols-3 gap-3">
            {images
              .filter((_, i) => i !== activeIndex)
              .slice(0, 3)
              .map((src) => {
                const realIndex = images.indexOf(src);
                return (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={`${src}-${realIndex}`}
                    src={src}
                    alt={name}
                    loading="lazy"
                    width={400}
                    height={400}
                    onClick={() => setActiveIndex(realIndex)}
                    className="w-full aspect-square object-cover rounded-lg border cursor-pointer"
                  />
                );
              })}
          </div>
        ) : null}
      </div>
      <div className="flex flex-col gap-6">
        {rightColumnAboveColor}
        {needsColor && (
          <div>
            <label className="block text-sm font-semibold mb-2">
              {colorLabel}
            </label>
            <div className="flex flex-wrap gap-3">
              {variants.map((v) => {
                const thumb = v.imageUrls[0];
                const isSelected = selectedColor === v.color;
                return (
                  <button
                    key={v.color}
                    type="button"
                    onClick={() => setSelectedColor(v.color)}
                    className="flex flex-col items-center gap-1"
                  >
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumb}
                        alt={v.color}
                        width={64}
                        height={64}
                        className={cn(
                          "size-16 rounded-md border-2 object-cover",
                          isSelected ? "border-primary" : "border-border",
                        )}
                      />
                    ) : (
                      <div
                        className={cn(
                          "size-16 rounded-md border-2 bg-muted flex items-center justify-center text-xs font-semibold",
                          isSelected ? "border-primary" : "border-border",
                        )}
                      >
                        {capitalize(v.color)}
                      </div>
                    )}
                    <span
                      className={cn(
                        "text-xs font-medium",
                        isSelected ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      {capitalize(v.color)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {rightColumnBelowColor}
      </div>
    </div>
  );
}
