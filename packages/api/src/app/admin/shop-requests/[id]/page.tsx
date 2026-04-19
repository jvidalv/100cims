"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAdminShopRequestDetail,
  useUpdateAdminShopRequest,
} from "@/domains/admin/api";
import { formatDateTime } from "@/lib/format-date";

type Status = "requested" | "contacted" | "done" | "cancelled";

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: "requested", label: "Requested" },
  { value: "contacted", label: "Contacted" },
  { value: "done", label: "Done" },
  { value: "cancelled", label: "Cancelled" },
];

export default function AdminShopRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const detail = useAdminShopRequestDetail(id);
  const update = useUpdateAdminShopRequest(id);

  const [comments, setComments] = useState("");

  useEffect(() => {
    if (detail.data) setComments(detail.data.comments ?? "");
  }, [detail.data]);

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
          href="/admin/shop-requests"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Shop requests
        </Link>
        <p className="text-red-600">
          {detail.error?.message ?? "Shop request not found"}
        </p>
      </div>
    );
  }

  const r = detail.data;

  const onStatusChange = (next: Status) => {
    update.mutate(
      { status: next },
      {
        onSuccess: () => toast.success(`Marked as ${next}`),
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const saveComments = () => {
    update.mutate(
      { comments: comments.trim() || null },
      {
        onSuccess: () => toast.success("Comments saved"),
        onError: (err) => toast.error(err.message),
      },
    );
  };

  return (
    <div className="p-8 max-w-3xl space-y-6">
      <div>
        <Link
          href="/admin/shop-requests"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Shop requests
        </Link>
        <h1 className="text-2xl font-bold mt-2">Request from {r.userEmail}</h1>
        <p className="text-sm text-muted-foreground">
          Received {formatDateTime(r.createdAt)}
          {r.updatedAt.getTime() !== r.createdAt.getTime() &&
            ` · Updated ${formatDateTime(r.updatedAt)}`}
        </p>
      </div>

      <div className="space-y-1">
        <Label>Status</Label>
        <Select value={r.status} onValueChange={onStatusChange}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label>Message</Label>
        <pre className="whitespace-pre-wrap rounded border bg-muted/40 p-4 text-sm font-mono">
          {r.message}
        </pre>
      </div>

      <div className="space-y-1">
        <Label htmlFor="comments">Admin comments</Label>
        <textarea
          id="comments"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="Internal notes (follow-up date, quoted price, shipping details…)"
          className="flex w-full rounded border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <div className="flex justify-end">
          <Button
            onClick={saveComments}
            disabled={update.isPending || comments === (r.comments ?? "")}
          >
            Save comments
          </Button>
        </div>
      </div>
    </div>
  );
}
