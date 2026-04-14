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
import { useAdminUsers } from "@/domains/admin/api";
import { formatDate } from "@/lib/format-date";

const ANY = "__any__";

export default function AdminUsersPage() {
  const router = useRouter();
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [q, setQ] = useQueryState("q", parseAsString.withDefault(""));
  const [country, setCountry] = useQueryState(
    "country",
    parseAsString.withDefault(""),
  );
  const [platform, setPlatform] = useQueryState(
    "platform",
    parseAsString.withDefault(""),
  );
  const [version, setVersion] = useQueryState(
    "version",
    parseAsString.withDefault(""),
  );
  const [sort, setSort] = useQueryState("sort", parseAsString.withDefault(""));
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

  const { data, error, isLoading } = useAdminUsers({
    page,
    q,
    country,
    platform,
    version,
    sort,
  });

  const pickFilter =
    (setter: (v: string | null) => Promise<URLSearchParams>) =>
    (value: string) => {
      void setter(value === ANY ? null : value);
      void setPage(1);
    };

  const hasActiveFilters = Boolean(country || platform || version || q || sort);

  const clearFilters = () => {
    void setQ(null);
    void setCountry(null);
    void setPlatform(null);
    void setVersion(null);
    void setSort(null);
    void setPage(1);
    setSearch("");
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Users</h1>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Input
          type="search"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />

        <Select value={country || ANY} onValueChange={pickFilter(setCountry)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any country</SelectItem>
            {data?.facets.countries.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={platform || ANY} onValueChange={pickFilter(setPlatform)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any platform</SelectItem>
            {data?.facets.platforms.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={version || ANY} onValueChange={pickFilter(setVersion)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Version" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any version</SelectItem>
            {data?.facets.versions.map((v) => (
              <SelectItem key={v} value={v} className="font-mono">
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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

        {hasActiveFilters && (
          <Button size="sm" variant="ghost" onClick={clearFilters}>
            Clear
          </Button>
        )}
      </div>

      {error && <p className="text-red-600 mb-4">{error.message}</p>}
      {isLoading && !data && <p className="text-muted-foreground">Loading…</p>}

      {data && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-4 font-medium">User</th>
                  <th className="py-2 pr-4 font-medium">Email</th>
                  <th className="py-2 pr-4 font-medium">Active challenge</th>
                  <th className="py-2 pr-4 font-medium">Country</th>
                  <th className="py-2 pr-4 font-medium">Platform</th>
                  <th className="py-2 pr-4 font-medium">Version</th>
                  <th className="py-2 pr-4 font-medium">Push</th>
                  <th className="py-2 pr-4 font-medium text-right">Summits</th>
                  <th className="py-2 pr-4 font-medium">Last summit</th>
                  <th className="py-2 pr-4 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((u) => {
                  const name =
                    [u.firstName, u.lastName].filter(Boolean).join(" ") ||
                    u.username;
                  const initials = name.slice(0, 2).toUpperCase();
                  return (
                    <tr
                      key={u.id}
                      className="border-b hover:bg-muted/40 cursor-pointer"
                      onClick={() => router.push(`/admin/users/${u.id}`)}
                    >
                      <td className="py-2 pr-4">
                        <div className="flex items-center gap-2">
                          <Avatar className="size-6">
                            {u.imageUrl && (
                              <AvatarImage src={u.imageUrl} alt={name} />
                            )}
                            <AvatarFallback>{initials}</AvatarFallback>
                          </Avatar>
                          <span>{name}</span>
                        </div>
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {u.email}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {u.activeChallengeName ?? "—"}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {u.country ?? "—"}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {u.platform ?? "—"}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground font-mono">
                        {u.appVersion ?? "—"}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {u.hasPushToken ? "Yes" : "No"}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground text-right tabular-nums">
                        {u.totalSummits}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {u.lastSummitAt ? formatDate(u.lastSummitAt) : "—"}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {formatDate(u.createdAt)}
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
                      No users match the current filters.
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
              Page {data.page} of {data.totalPages} · {data.total} users
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
