"use client";

import Link from "next/link";
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
import { useAdminPlans } from "@/domains/admin/api";

const ANY = "__any__";

const STATUS_BADGE: Record<string, string> = {
  open: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-300",
  completed: "bg-sky-100 text-sky-900 dark:bg-sky-900/30 dark:text-sky-300",
  canceled: "bg-rose-100 text-rose-900 dark:bg-rose-900/30 dark:text-rose-300",
};

export default function AdminPlansPage() {
  const router = useRouter();
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [q, setQ] = useQueryState("q", parseAsString.withDefault(""));
  const [status, setStatus] = useQueryState(
    "status",
    parseAsString.withDefault(""),
  );
  const [speed, setSpeed] = useQueryState(
    "speed",
    parseAsString.withDefault(""),
  );
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

  const { data, error, isLoading } = useAdminPlans({
    page,
    q,
    status,
    speed,
  });

  const pickFilter =
    (setter: (v: string | null) => Promise<URLSearchParams>) =>
    (value: string) => {
      void setter(value === ANY ? null : value);
      void setPage(1);
    };

  const hasActiveFilters = Boolean(status || speed || q);

  const clearFilters = () => {
    void setQ(null);
    void setStatus(null);
    void setSpeed(null);
    void setPage(1);
    setSearch("");
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Plans</h1>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Input
          type="search"
          placeholder="Search by title or creator…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />

        <Select value={status || ANY} onValueChange={pickFilter(setStatus)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any status</SelectItem>
            {data?.facets.statuses.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={speed || ANY} onValueChange={pickFilter(setSpeed)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Speed" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any speed</SelectItem>
            {data?.facets.speeds.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
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
                  <th className="py-2 pr-4 font-medium">Plan</th>
                  <th className="py-2 pr-4 font-medium">Creator</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Speed</th>
                  <th className="py-2 pr-4 font-medium">Start</th>
                  <th className="py-2 pr-4 font-medium">People</th>
                  <th className="py-2 pr-4 font-medium">Mountains</th>
                  <th className="py-2 pr-4 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((p) => {
                  const creatorName =
                    [p.creatorFirstName, p.creatorLastName]
                      .filter(Boolean)
                      .join(" ") ||
                    p.creatorUsername ||
                    "—";
                  const creatorInitials = creatorName.slice(0, 2).toUpperCase();
                  const badgeClass =
                    STATUS_BADGE[p.status] ?? "bg-muted text-muted-foreground";
                  return (
                    <tr
                      key={p.id}
                      className="border-b hover:bg-muted/40 cursor-pointer"
                      onClick={() => router.push(`/admin/plans/${p.id}`)}
                    >
                      <td className="py-2 pr-4">
                        <div className="flex items-center gap-2">
                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt=""
                              className="size-8 rounded object-cover"
                            />
                          ) : (
                            <div className="size-8 rounded bg-muted flex items-center justify-center text-xs">
                              🗺
                            </div>
                          )}
                          <span className="font-medium">{p.title}</span>
                        </div>
                      </td>
                      <td
                        className="py-2 pr-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link
                          href={`/admin/users/${p.creatorId}`}
                          className="flex items-center gap-2 hover:underline"
                        >
                          <Avatar className="size-6">
                            {p.creatorImageUrl && (
                              <AvatarImage
                                src={p.creatorImageUrl}
                                alt={creatorName}
                              />
                            )}
                            <AvatarFallback>{creatorInitials}</AvatarFallback>
                          </Avatar>
                          <span>{creatorName}</span>
                        </Link>
                      </td>
                      <td className="py-2 pr-4">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${badgeClass}`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {p.speed}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {p.startDate
                          ? new Date(p.startDate).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {p.participantsCount}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {p.mountainsCount}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
                {data.items.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No plans match the current filters.
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
              Page {data.page} of {data.totalPages} · {data.total} plans
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
