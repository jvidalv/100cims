"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type Props = {
  token: string;
  ctaLabel: string;
  pendingLabel: string;
  successTitle: string;
  successBody: string;
};

export function ResubscribeButton({
  token,
  ctaLabel,
  pendingLabel,
  successTitle,
  successBody,
}: Props) {
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onClick = async () => {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/public/resubscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setPending(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
        <p className="font-semibold text-emerald-900">{successTitle}</p>
        <p className="mt-1 text-sm text-emerald-900/80">{successBody}</p>
      </div>
    );
  }

  return (
    <div>
      <Button onClick={onClick} disabled={pending} variant="outline">
        {pending ? pendingLabel : ctaLabel}
      </Button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
