"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { MAX_IMAGE_KB } from "@/api/lib/images";
import { fileToBase64 } from "@/app/admin/_lib/file-to-base64";
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
import { PLAN_SPEEDS, type PlanSpeed } from "@/db/enums";

const isPlanSpeed = (v: string): v is PlanSpeed =>
  (PLAN_SPEEDS as readonly string[]).includes(v);
import { useCreateAdminPlan } from "@/domains/admin/api";

export default function AdminPlanNewPage() {
  const router = useRouter();
  const create = useCreateAdminPlan();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [speed, setSpeed] = useState<PlanSpeed>("normal");
  const [isPrivate, setIsPrivate] = useState(false);
  const [publishAsCims, setPublishAsCims] = useState(false);
  const [challengeId, setChallengeId] = useState("");
  const [mountainIdsText, setMountainIdsText] = useState("");
  const [imageValue, setImageValue] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const onPickImage = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const base64 = await fileToBase64(file);
      const sizeKB = Math.ceil((base64.length * 3) / 4 / 1024);
      if (sizeKB > MAX_IMAGE_KB) {
        toast.error(`Image too large (${sizeKB} KB · max ${MAX_IMAGE_KB} KB)`);
        return;
      }
      setImageValue(base64);
    } finally {
      setUploading(false);
    }
  };

  const submit = () => {
    const mountainIds = mountainIdsText
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    create.mutate(
      {
        title: title.trim(),
        description: description.trim() || undefined,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        speed,
        isPrivate,
        publishAsCims,
        challengeId: challengeId.trim() || undefined,
        mountainIds: mountainIds.length > 0 ? mountainIds : undefined,
        imageUrl: imageValue,
      },
      {
        onSuccess: ({ id }) => {
          toast.success("Created");
          router.push(`/admin/plans/${id}`);
        },
        onError: (e) =>
          toast.error(e instanceof Error ? e.message : "Create failed"),
      },
    );
  };

  const canSubmit = !!title.trim() && !uploading && !create.isPending;

  return (
    <div className="p-8 space-y-6">
      <div className="space-y-1">
        <Link
          href="/admin/plans"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Plans
        </Link>
        <h1 className="text-2xl font-bold">New plan</h1>
      </div>

      <div className="space-y-4 max-w-2xl">
        <div className="space-y-1">
          <Label>Title</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Cap a la Pica d'Estats"
          />
        </div>

        <div className="space-y-1">
          <Label>Description</Label>
          <textarea
            value={description}
            rows={4}
            onChange={(e) => setDescription(e.target.value)}
            className="flex w-full rounded border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            placeholder="Detalls de la sortida"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Start date</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Speed</Label>
            <Select
              value={speed}
              onValueChange={(v) => {
                if (isPlanSpeed(v)) setSpeed(v);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLAN_SPEEDS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1">
          <Label>Mountain IDs</Label>
          <textarea
            value={mountainIdsText}
            rows={2}
            onChange={(e) => setMountainIdsText(e.target.value)}
            className="flex w-full rounded border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            placeholder="UUIDs separated by commas or whitespace"
          />
          <p className="text-xs text-muted-foreground">
            Optional. Paste mountain UUIDs to link them to the plan.
          </p>
        </div>

        <div className="space-y-1">
          <Label>Challenge ID</Label>
          <Input
            value={challengeId}
            onChange={(e) => setChallengeId(e.target.value)}
            placeholder="Optional — defaults to the standard 100cims challenge"
          />
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
                JPG, PNG or WebP
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={uploading}
                onChange={(e) => {
                  void onPickImage(e.target.files?.[0] ?? null);
                  e.target.value = "";
                }}
                className="sr-only"
              />
            </label>
          )}
        </div>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
            />
            <span>Private (invite-only)</span>
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={publishAsCims}
              onChange={(e) => setPublishAsCims(e.target.checked)}
            />
            <span>Publish as Cims (official account)</span>
          </label>
        </div>
        {publishAsCims && (
          <p className="text-xs text-muted-foreground">
            Plan will be created with the official Cims account as creator.
          </p>
        )}

        <div className="flex items-center gap-3 pt-2">
          <Button disabled={!canSubmit} onClick={submit}>
            {create.isPending ? "Creating…" : "Create"}
          </Button>
        </div>
      </div>
    </div>
  );
}
