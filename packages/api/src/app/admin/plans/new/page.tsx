"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { MAX_IMAGE_KB } from "@/api/lib/images";
import { fileToBase64 } from "@/app/admin/_lib/file-to-base64";
import { SearchPicker } from "@/app/admin/_lib/search-picker";
import { useMountainSearch } from "@/app/admin/_lib/use-mountain-search";
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
import { useAdminChallenges, useCreateAdminPlan } from "@/domains/admin/api";

const isPlanSpeed = (v: string): v is PlanSpeed =>
  (PLAN_SPEEDS as readonly string[]).includes(v);

type SelectedMountain = { id: string; name: string; location: string };
type SelectedChallenge = { id: string; name: string };

const useChallengeSearch = (q: string) => {
  const { data, isLoading } = useAdminChallenges(
    { page: 1, q, kind: "" },
    { enabled: q.trim().length > 0 },
  );
  return { items: data?.items ?? [], isLoading };
};

export default function AdminPlanNewPage() {
  const router = useRouter();
  const create = useCreateAdminPlan();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [speed, setSpeed] = useState<PlanSpeed>("normal");
  const [isPrivate, setIsPrivate] = useState(false);
  const [publishAsCims, setPublishAsCims] = useState(false);
  const [selectedChallenge, setSelectedChallenge] =
    useState<SelectedChallenge | null>(null);
  const [selectedMountains, setSelectedMountains] = useState<
    SelectedMountain[]
  >([]);
  const [imageValue, setImageValue] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const selectedMountainIds = new Set(selectedMountains.map((m) => m.id));

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
    create.mutate(
      {
        title: title.trim(),
        description: description.trim() || undefined,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        speed,
        isPrivate,
        publishAsCims,
        challengeId: selectedChallenge?.id,
        mountainIds: selectedMountains.length
          ? selectedMountains.map((m) => m.id)
          : undefined,
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

        <div className="space-y-2">
          <Label>Mountains</Label>
          {selectedMountains.length > 0 && (
            <ul className="flex flex-wrap gap-1.5">
              {selectedMountains.map((m) => (
                <li
                  key={m.id}
                  className="inline-flex items-center gap-1.5 rounded border bg-muted/40 pl-2 pr-1 py-0.5 text-sm"
                >
                  <span>{m.name}</span>
                  {m.location && (
                    <span className="text-xs text-muted-foreground">
                      · {m.location}
                    </span>
                  )}
                  <button
                    type="button"
                    aria-label={`Remove ${m.name}`}
                    onClick={() =>
                      setSelectedMountains((prev) =>
                        prev.filter((x) => x.id !== m.id),
                      )
                    }
                    className="text-muted-foreground hover:text-foreground rounded px-1 leading-none"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
          <SearchPicker
            placeholder="Search mountains by name or location…"
            emptyLabel="No mountains match."
            useResults={useMountainSearch}
            excludeIds={selectedMountainIds}
            onPick={(m) =>
              setSelectedMountains((prev) => [
                ...prev,
                { id: m.id, name: m.name, location: m.location },
              ])
            }
            renderOption={(m) => (
              <>
                <span className="font-medium">{m.name}</span>
                {m.location && (
                  <span className="text-xs text-muted-foreground">
                    {m.location}
                  </span>
                )}
              </>
            )}
          />
        </div>

        <div className="space-y-2">
          <Label>Challenge</Label>
          {selectedChallenge ? (
            <span className="inline-flex items-center gap-1.5 rounded border bg-muted/40 pl-2 pr-1 py-0.5 text-sm">
              <span>{selectedChallenge.name}</span>
              <button
                type="button"
                aria-label={`Remove ${selectedChallenge.name}`}
                onClick={() => setSelectedChallenge(null)}
                className="text-muted-foreground hover:text-foreground rounded px-1 leading-none"
              >
                ×
              </button>
            </span>
          ) : (
            <SearchPicker
              placeholder="Optional — defaults to the standard 100cims challenge"
              emptyLabel="No challenges match."
              useResults={useChallengeSearch}
              onPick={(c) => setSelectedChallenge({ id: c.id, name: c.name })}
              renderOption={(c) => (
                <>
                  <span className="font-medium">{c.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {c.slug}
                  </span>
                </>
              )}
            />
          )}
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
