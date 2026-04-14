"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useCrons, useTriggerCron } from "@/domains/admin/api";
import { cronIntervalSeconds, humanizeCron } from "@/lib/humanize-cron";

export default function AdminCronsPage() {
  const { data: crons, error, isLoading } = useCrons();
  const triggerCron = useTriggerCron();
  const [lastRun, setLastRun] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!crons) return;
    const names = new Set(crons.map((c) => c.name));
    setLastRun((p) => {
      const next: Record<string, string> = {};
      let changed = false;
      for (const [k, v] of Object.entries(p)) {
        if (names.has(k)) next[k] = v;
        else changed = true;
      }
      return changed ? next : p;
    });
  }, [crons]);

  const onTrigger = (name: string) =>
    triggerCron.mutate(name, {
      onSuccess: (data) =>
        setLastRun((p) => ({ ...p, [name]: `${data.durationMs}ms` })),
      onError: (e) => setLastRun((p) => ({ ...p, [name]: e.message })),
    });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Crons</h1>

      {error && <p className="text-red-600 mb-4">{error.message}</p>}
      {isLoading && <p className="text-muted-foreground">Loading…</p>}

      {crons && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 font-medium">Name</th>
                <th className="pb-2 font-medium">Schedule</th>
                <th className="pb-2 font-medium">Last run</th>
                <th className="pb-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...crons]
                .sort(
                  (a, b) =>
                    cronIntervalSeconds(a.pattern) -
                    cronIntervalSeconds(b.pattern),
                )
                .map((c) => {
                const running =
                  triggerCron.isPending && triggerCron.variables === c.name;
                return (
                  <tr key={c.name} className="border-b align-top">
                    <td className="py-2">
                      <div className="font-mono">{c.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 max-w-md">
                        {c.description}
                      </div>
                    </td>
                    <td className="py-2">
                      <div>{humanizeCron(c.pattern)}</div>
                      <div className="text-xs font-mono text-muted-foreground mt-0.5">
                        {c.pattern}
                      </div>
                    </td>
                    <td className="py-2 text-muted-foreground">
                      {lastRun[c.name] ?? "—"}
                    </td>
                    <td className="py-2 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={running}
                        onClick={() => onTrigger(c.name)}
                      >
                        {running ? "Running…" : "Trigger"}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
