"use client";

import { useRouter } from "next/navigation";
import {
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  useQueryState,
} from "nuqs";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminRoutes } from "@/domains/admin/api";

export default function AdminRoutesPage() {
  const router = useRouter();
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [q, setQ] = useQueryState("q", parseAsString.withDefault(""));
  const [mountainSlug, setMountainSlug] = useQueryState(
    "mountainSlug",
    parseAsString.withDefault(""),
  );
  const [multiPeak, setMultiPeak] = useQueryState(
    "multiPeak",
    parseAsBoolean.withDefault(false),
  );
  const [search, setSearch] = useState(q);
  const [slugSearch, setSlugSearch] = useState(mountainSlug);

  // Debounce the free-text filters so we don't fire one query per keystroke.
  useEffect(() => {
    const id = setTimeout(() => {
      if (search !== q) {
        void setQ(search || null);
        void setPage(1);
      }
    }, 300);
    return () => clearTimeout(id);
  }, [search, q, setQ, setPage]);

  useEffect(() => {
    const id = setTimeout(() => {
      if (slugSearch !== mountainSlug) {
        void setMountainSlug(slugSearch || null);
        void setPage(1);
      }
    }, 300);
    return () => clearTimeout(id);
  }, [slugSearch, mountainSlug, setMountainSlug, setPage]);

  const { data, error, isLoading } = useAdminRoutes({
    page,
    q,
    mountainSlug,
    multiPeak,
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Routes</h1>

      <div className="flex flex-wrap gap-3 mb-6 items-center">
        <Input
          type="search"
          placeholder="Search by title or external id…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Input
          type="search"
          placeholder="Filter by mountain slug…"
          value={slugSearch}
          onChange={(e) => setSlugSearch(e.target.value)}
          className="max-w-sm"
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={multiPeak}
            onChange={(e) => {
              void setMultiPeak(e.target.checked || null);
              void setPage(1);
            }}
          />
          Multi-peak only
        </label>
      </div>

      {error && <p className="text-red-600 mb-4">{error.message}</p>}
      {isLoading && !data && <p className="text-muted-foreground">Loading…</p>}

      {data && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-4 font-medium">Title</th>
                  <th className="py-2 pr-4 font-medium">Mountains</th>
                  <th className="py-2 pr-4 font-medium">Distance</th>
                  <th className="py-2 pr-4 font-medium">Elev gain</th>
                  <th className="py-2 pr-4 font-medium">Type</th>
                  <th className="py-2 pr-4 font-medium">Source</th>
                  <th className="py-2 pr-4 font-medium">External id</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b hover:bg-muted/40 cursor-pointer"
                    onClick={() => router.push(`/admin/routes/${r.id}`)}
                  >
                    <td className="py-2 pr-4">
                      <div className="font-medium">{r.title.en}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">
                        {r.title.ca}
                      </div>
                    </td>
                    <td className="py-2 pr-4">
                      {r.mountains.length > 0 ? (
                        <div className="flex flex-col gap-1.5">
                          {r.mountains.map((m) => (
                            <div
                              key={m.slug}
                              className="flex items-center gap-2"
                            >
                              {m.imageUrl ? (
                                <img
                                  src={m.imageUrl}
                                  alt=""
                                  className="size-6 rounded object-cover bg-muted"
                                />
                              ) : (
                                <div className="size-6 rounded bg-muted" />
                              )}
                              <div className="leading-tight">
                                <div className="text-xs font-medium">
                                  {m.name}
                                </div>
                                <div className="text-[10px] text-muted-foreground font-mono">
                                  {m.slug}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground font-mono">
                      {r.distanceMeters != null
                        ? `${(r.distanceMeters / 1000).toFixed(1)} km`
                        : "—"}
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground font-mono">
                      {r.elevationGainMeters != null
                        ? `${r.elevationGainMeters} m`
                        : "—"}
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {r.trailType ?? "—"}
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {r.source}
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground font-mono">
                      {r.externalId}
                    </td>
                  </tr>
                ))}
                {data.items.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No routes match the current filters.
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
              Page {data.pagination.page} of {data.pagination.totalPages} ·{" "}
              {data.pagination.totalItems} routes
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= data.pagination.totalPages}
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
