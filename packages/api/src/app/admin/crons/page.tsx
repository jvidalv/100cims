"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

type Cron = { name: string; pattern: string };

const TOKEN_KEY = "admin-token";

export default function AdminCronsPage() {
  const [token, setToken] = useState<string>("");
  const [crons, setCrons] = useState<Cron[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<Record<string, string>>({});

  useEffect(() => {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (saved) setToken(saved);
  }, []);

  const load = async (t: string) => {
    setError(null);
    try {
      const res = await fetch("/api/admin/crons", {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (!res.ok) {
        setError(`${res.status} ${res.statusText}`);
        setCrons(null);
        return;
      }
      const data = (await res.json()) as { message: Cron[] };
      setCrons(data.message);
    } catch (e) {
      setError(String(e));
    }
  };

  useEffect(() => {
    if (token) void load(token);
  }, [token]);

  const saveToken = () => {
    localStorage.setItem(TOKEN_KEY, token);
    void load(token);
  };

  const trigger = async (name: string) => {
    setRunning(name);
    try {
      const res = await fetch(`/api/admin/crons/${name}/trigger`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as { durationMs?: number; error?: string };
      if (!res.ok) {
        setLastRun((p) => ({ ...p, [name]: data.error ?? `${res.status}` }));
      } else {
        setLastRun((p) => ({ ...p, [name]: `${data.durationMs}ms` }));
      }
    } catch (e) {
      setLastRun((p) => ({ ...p, [name]: String(e) }));
    } finally {
      setRunning(null);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin" className="text-sm text-muted-foreground hover:underline">
          ← Admin
        </Link>
        <h1 className="text-2xl font-bold">Crons</h1>
      </div>

      <div className="mb-6 flex gap-2 items-center">
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Bearer token"
          className="flex-1 border rounded px-3 py-2 text-sm"
        />
        <Button onClick={saveToken}>Save & load</Button>
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {crons && (
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
            {crons.map((c) => (
              <tr key={c.name} className="border-b">
                <td className="py-2 font-mono">{c.name}</td>
                <td className="py-2 font-mono text-muted-foreground">
                  {c.pattern}
                </td>
                <td className="py-2 text-muted-foreground">
                  {lastRun[c.name] ?? "—"}
                </td>
                <td className="py-2 text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={running === c.name}
                    onClick={() => trigger(c.name)}
                  >
                    {running === c.name ? "Running…" : "Trigger"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
