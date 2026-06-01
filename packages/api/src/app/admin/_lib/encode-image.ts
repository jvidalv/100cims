/**
 * Client-side image-pick → downscale → JPEG re-encode → raw base64.
 *
 * Replaces the previous `fileToBase64` flow for image inputs in the admin
 * dashboard. Server enforces `MAX_IMAGE_KB` (3072 KB) via
 * `isBase64SizeValid`; modern phone cameras routinely produce 5–10 MB JPEGs
 * and HEIC/PNG payloads that blow past that cap. Resizing in the browser
 * is cheaper than asking the admin to find a separate tool, and it keeps
 * the server's size guard meaningful as a defence-in-depth.
 *
 * Strategy:
 * 1. Read the file via `createImageBitmap` (or HTMLImageElement fallback)
 *    so EXIF orientation is honoured by the browser.
 * 2. Scale to fit within MAX_EDGE_PX, preserving aspect ratio.
 * 3. Draw onto a canvas, export as JPEG at QUALITY_STEPS in descending
 *    order until the encoded payload fits MAX_IMAGE_KB.
 * 4. Return the raw base64 (no data: prefix) so callers stay compatible
 *    with the existing upload pipeline.
 *
 * Throws `ImageTooBigError` if even the smallest quality step blows past
 * the limit — the caller is expected to toast the message.
 */
import { MAX_IMAGE_KB } from "@/api/lib/images";

const MAX_EDGE_PX = 1920;
// Try quality 0.85 first (visually indistinguishable from 1.0 for photos);
// step down to 0.5 if the image is still too big. 0.5 looks rough but is the
// last-ditch attempt before failing.
const QUALITY_STEPS = [0.85, 0.7, 0.55] as const;

export class ImageTooBigError extends Error {
  constructor(approxKB: number) {
    super(
      `Image too large (${approxKB} KB after compression · max ${MAX_IMAGE_KB} KB). Try a smaller image.`,
    );
    this.name = "ImageTooBigError";
  }
}

const loadBitmap = async (file: File): Promise<ImageBitmap> => {
  // createImageBitmap honours EXIF orientation natively in modern browsers
  // and avoids the synchronous decode cost of an <img> roundtrip.
  if (typeof createImageBitmap === "function") {
    return createImageBitmap(file, { imageOrientation: "from-image" });
  }
  // Fallback for the rare browser without createImageBitmap. We pay an
  // extra Object URL but it's the simplest cross-browser shim.
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.getContext("2d")?.drawImage(img, 0, 0);
    return await createImageBitmap(canvas);
  } finally {
    URL.revokeObjectURL(url);
  }
};

const scaledSize = (
  width: number,
  height: number,
  maxEdge: number,
): { width: number; height: number } => {
  if (width <= maxEdge && height <= maxEdge) return { width, height };
  const ratio = width > height ? maxEdge / width : maxEdge / height;
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
};

const canvasToBase64Jpeg = async (
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<{ base64: string; bytes: number }> => {
  // Prefer the async, non-main-thread path. Falls back to toDataURL for
  // browsers without toBlob (none we ship to, but cheap belt-and-braces).
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );
  if (!blob) {
    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    const comma = dataUrl.indexOf(",");
    const base64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
    return { base64, bytes: Math.ceil((base64.length * 3) / 4) };
  }
  const buffer = await blob.arrayBuffer();
  const base64 = arrayBufferToBase64(buffer);
  return { base64, bytes: blob.size };
};

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  // Browser-only helper. Streaming chunks avoids "maximum call stack" on
  // multi-MB buffers when calling fromCharCode on the whole array.
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
};

export const encodeImageForUpload = async (file: File): Promise<string> => {
  const bitmap = await loadBitmap(file);
  const { width, height } = scaledSize(
    bitmap.width,
    bitmap.height,
    MAX_EDGE_PX,
  );
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const maxBytes = MAX_IMAGE_KB * 1024;
  let lastBytes = 0;
  for (const quality of QUALITY_STEPS) {
    const { base64, bytes } = await canvasToBase64Jpeg(canvas, quality);
    lastBytes = bytes;
    if (bytes <= maxBytes) return base64;
  }
  throw new ImageTooBigError(Math.round(lastBytes / 1024));
};
