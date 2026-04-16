"use client";

import { Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useCampaignStats,
  useTriggerCampaign,
  type CampaignSlug,
} from "@/domains/admin/api";

type Props = {
  slug: CampaignSlug;
  audienceDescription: string;
};

export function CampaignTrigger({ slug, audienceDescription }: Props) {
  const [batchSize, setBatchSize] = useState(50);
  const stats = useCampaignStats(slug);
  const trigger = useTriggerCampaign();

  const onTrigger = () => {
    trigger.mutate(
      { slug, batchSize },
      {
        onSuccess: (res) => {
          const msg = res?.message;
          if (!msg) return toast.success("Campaign triggered");
          toast.success(
            `Sent ${msg.sent} / ${msg.attempted}${msg.failed > 0 ? ` (${msg.failed} failed)` : ""}`,
          );
        },
        onError: (e) =>
          toast.error(e instanceof Error ? e.message : "Trigger failed"),
      },
    );
  };

  const eligible = stats.data?.eligibleRemaining;
  const disabled = trigger.isPending || stats.isLoading || eligible === 0;

  return (
    <div className="border rounded p-4 space-y-4 bg-muted/30">
      <h2 className="text-lg font-semibold">Campaign</h2>
      <p className="text-sm text-muted-foreground">
        Audience: {audienceDescription}
      </p>

      <div className="grid grid-cols-2 gap-4 max-w-md">
        <div>
          <div className="text-xs text-muted-foreground">Reached</div>
          <div className="text-2xl font-bold tabular-nums">
            {stats.data ? stats.data.reached.toLocaleString() : "—"}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">
            Eligible remaining
          </div>
          <div className="text-2xl font-bold tabular-nums">
            {stats.data ? stats.data.eligibleRemaining.toLocaleString() : "—"}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label htmlFor="batch-size">Batch size</Label>
          <Input
            id="batch-size"
            type="number"
            min={1}
            max={500}
            value={batchSize}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (Number.isFinite(n)) setBatchSize(n);
            }}
            className="w-[120px]"
          />
        </div>
        <Button onClick={onTrigger} disabled={disabled}>
          <Send className="size-4 mr-2" />
          Send to next {batchSize}
        </Button>
      </div>
    </div>
  );
}
