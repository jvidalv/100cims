"use client";

import { useRouter } from "next/navigation";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminChallenges } from "@/domains/admin/api";
import { formatDate } from "@/lib/format-date";

const PASTEL_BGS = [
  "#BAE1FF",
  "#FFFFBA",
  "#BAFFC9",
  "#FFDFBA",
  "#E2C2FF",
  "#98CDF8",
  "#D5ABFF",
  "#BAC8FF",
  "#E3FFBA",
  "#BABBFF",
  "#FFBABA",
  "#C2FFE8",
  "#D1FFBA",
  "#FFD9BA",
  "#EEBAFF",
  "#F9C0C0",
  "#BFFCC6",
  "#C0D6E4",
  "#FFD1DC",
  "#FFF5BA",
  "#C6E2FF",
  "#D5E8D4",
  "#FDE2E4",
  "#F0E5DE",
];

export default function AdminChallengesPage() {
  const router = useRouter();
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [q, setQ] = useQueryState("q", parseAsString.withDefault(""));
  const [kind, setKind] = useQueryState("kind", parseAsString.withDefault(""));
  const [search, setSearch] = useState(q);

  useEffect(() => {
    const id = setTimeout(() => {
      if (search !== q) {
        void setQ(search || null);
        void setPage(1);
      }
    }, 300);
    return () => clearTimeout(id);
  }, [search, q, setQ, setPage]);

  const { data, error, isLoading } = useAdminChallenges({ page, q, kind });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Challenges</h1>

      <div className="flex flex-wrap gap-3 mb-6">
        <Input
          type="search"
          placeholder="Search by name or slug…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <select
          value={kind}
          onChange={(e) => {
            void setKind(e.target.value || null);
            void setPage(1);
          }}
          className="h-9 rounded border border-input bg-background px-3 text-sm"
        >
          <option value="">All kinds</option>
          <option value="official">Official</option>
          <option value="community">Community</option>
        </select>
      </div>

      {error && <p className="text-red-600 mb-4">{error.message}</p>}
      {isLoading && !data && <p className="text-muted-foreground">Loading…</p>}

      {data && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-4 font-medium">Tile</th>
                  <th className="py-2 pr-4 font-medium">Name</th>
                  <th className="py-2 pr-4 font-medium">Country</th>
                  <th className="py-2 pr-4 font-medium">Kind</th>
                  <th className="py-2 pr-4 font-medium">Visibility</th>
                  <th className="py-2 pr-4 font-medium">Creator</th>
                  <th className="py-2 pr-4 font-medium">Mountains</th>
                  <th className="py-2 pr-4 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((c, i) => (
                  <tr
                    key={c.id}
                    className="border-b hover:bg-muted/40 cursor-pointer"
                    onClick={() => router.push(`/admin/challenges/${c.id}`)}
                  >
                    <td className="py-2 pr-4">
                      <div
                        className="size-10 rounded flex items-center justify-center text-lg"
                        style={{
                          backgroundColor: PASTEL_BGS[i % PASTEL_BGS.length],
                          color: "black",
                        }}
                      >
                        {c.emoji || "🏔️"}
                      </div>
                    </td>
                    <td className="py-2 pr-4">
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {c.slug}
                      </div>
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {c.country}
                    </td>
                    <td className="py-2 pr-4">
                      <Badge
                        variant={c.isOfficial ? "neutral" : "sky"}
                        label={c.isOfficial ? "Official" : "Community"}
                      />
                    </td>
                    <td className="py-2 pr-4">
                      <Badge
                        variant={c.isPublic ? "green" : "amber"}
                        label={c.isPublic ? "Public" : "Private"}
                      />
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {c.isOfficial ? "—" : (c.creatorName ?? "—")}
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground font-mono">
                      {c.totalMountains}
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {formatDate(c.createdAt)}
                    </td>
                  </tr>
                ))}
                {data.items.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No challenges match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-4 mt-4 text-sm">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <span className="text-muted-foreground">
              Page {data.page} of {data.totalPages} · {data.total} challenges
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= data.totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

const BADGE_STYLES = {
  neutral: "bg-muted text-foreground",
  sky: "bg-sky-100 text-sky-900 dark:bg-sky-900/30 dark:text-sky-300",
  green: "bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-300",
  amber: "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-300",
} as const;

function Badge({
  label,
  variant,
}: {
  label: string;
  variant: keyof typeof BADGE_STYLES;
}) {
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${BADGE_STYLES[variant]}`}
    >
      {label}
    </span>
  );
}
