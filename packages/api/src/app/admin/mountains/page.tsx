"use client";

import { useRouter } from "next/navigation";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { useEffect, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAdminChallengeOptions,
  useAdminMountains,
} from "@/domains/admin/api";
import { formatDate } from "@/lib/format-date";
import { formatRating } from "@/lib/format-rating";

export default function AdminMountainsPage() {
  const router = useRouter();
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [q, setQ] = useQueryState("q", parseAsString.withDefault(""));
  const [sort, setSort] = useQueryState("sort", parseAsString.withDefault(""));
  const [challengeId, setChallengeId] = useQueryState(
    "challengeId",
    parseAsString.withDefault(""),
  );
  const [search, setSearch] = useState(q);

  const { data: challenges } = useAdminChallengeOptions();

  useEffect(() => {
    const id = setTimeout(() => {
      if (search !== q) {
        void setQ(search || null);
        void setPage(1);
      }
    }, 300);
    return () => clearTimeout(id);
  }, [search, q, setQ, setPage]);

  const { data, error, isLoading } = useAdminMountains({
    page,
    q,
    sort,
    challengeId,
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Mountains</h1>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Input
          type="search"
          placeholder="Search by name or location…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />

        <Select
          value={sort || "createdAt_desc"}
          onValueChange={(value) => {
            void setSort(value === "createdAt_desc" ? null : value);
            void setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt_desc">Newest first</SelectItem>
            <SelectItem value="createdAt_asc">Oldest first</SelectItem>
            <SelectItem value="summits_desc">Most summits</SelectItem>
            <SelectItem value="summits_asc">Fewest summits</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={challengeId || "all"}
          onValueChange={(value) => {
            void setChallengeId(value === "all" ? null : value);
            void setPage(1);
          }}
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Challenge" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All challenges</SelectItem>
            {challenges?.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && <p className="text-red-600 mb-4">{error.message}</p>}
      {isLoading && !data && <p className="text-muted-foreground">Loading…</p>}

      {data && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-4 font-medium">Mountain</th>
                  <th className="py-2 pr-4 font-medium">Location</th>
                  <th className="py-2 pr-4 font-medium">Height</th>
                  <th className="py-2 pr-4 font-medium">Essential</th>
                  <th className="py-2 pr-4 font-medium">Family</th>
                  <th className="py-2 pr-4 font-medium">Dog</th>
                  <th className="py-2 pr-4 font-medium">Difficulty</th>
                  <th className="py-2 pr-4 font-medium text-right">Summits</th>
                  <th className="py-2 pr-4 font-medium">Creator</th>
                  <th className="py-2 pr-4 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((m) => {
                  const initials = m.name.slice(0, 2).toUpperCase();
                  return (
                    <tr
                      key={m.id}
                      className="border-b hover:bg-muted/40 cursor-pointer"
                      onClick={() => router.push(`/admin/mountains/${m.id}`)}
                    >
                      <td className="py-2 pr-4">
                        <div className="flex items-center gap-2">
                          <Avatar className="size-6">
                            {m.imageUrl && (
                              <AvatarImage src={m.imageUrl} alt={m.name} />
                            )}
                            <AvatarFallback>{initials}</AvatarFallback>
                          </Avatar>
                          <span>{m.name}</span>
                        </div>
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {m.location}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground font-mono">
                        {m.height} m
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {m.essential ? "✓" : "—"}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground font-mono">
                        {formatRating(
                          m.avgFamilyFriendly,
                          m.familyRatingCount,
                          {
                            withCount: true,
                          },
                        )}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground font-mono">
                        {formatRating(m.avgDogFriendly, m.dogRatingCount, {
                          withCount: true,
                        })}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground font-mono">
                        {formatRating(
                          m.avgDifficulty,
                          m.difficultyRatingCount,
                          {
                            withCount: true,
                          },
                        )}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground text-right tabular-nums">
                        {m.totalSummits}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {m.isOfficial ? "Official" : (m.creatorName ?? "—")}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {formatDate(m.createdAt)}
                      </td>
                    </tr>
                  );
                })}
                {data.items.length === 0 && (
                  <tr>
                    <td
                      colSpan={10}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No mountains match the current filters.
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
              Page {data.page} of {data.totalPages} · {data.total} mountains
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
