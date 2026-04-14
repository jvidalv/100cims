"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { useEffect, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminSummits } from "@/domains/admin/api";
import { formatDate } from "@/lib/format-date";

export default function AdminSummitsPage() {
  const router = useRouter();
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [q, setQ] = useQueryState("q", parseAsString.withDefault(""));
  const [validated, setValidated] = useQueryState(
    "validated",
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

  const { data, error, isLoading } = useAdminSummits({ page, q, validated });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Summits</h1>

      <div className="flex flex-wrap gap-3 mb-6">
        <Input
          type="search"
          placeholder="Search by mountain or user…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <select
          value={validated}
          onChange={(e) => {
            void setValidated(e.target.value || null);
            void setPage(1);
          }}
          className="h-9 rounded border border-input bg-background px-3 text-sm"
        >
          <option value="">All statuses</option>
          <option value="true">Validated</option>
          <option value="false">Not validated</option>
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
                  <th className="py-2 pr-4 font-medium">Photo</th>
                  <th className="py-2 pr-4 font-medium">Mountain</th>
                  <th className="py-2 pr-4 font-medium">Main user</th>
                  <th className="py-2 pr-4 font-medium">Related</th>
                  <th className="py-2 pr-4 font-medium">Validated</th>
                  <th className="py-2 pr-4 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((s) => {
                  const userName =
                    [s.userFirstName, s.userLastName]
                      .filter(Boolean)
                      .join(" ") ||
                    s.userUsername ||
                    "—";
                  const userInitials = userName.slice(0, 2).toUpperCase();
                  return (
                    <tr
                      key={s.id}
                      className="border-b hover:bg-muted/40 cursor-pointer"
                      onClick={() => router.push(`/admin/summits/${s.id}`)}
                    >
                      <td className="py-2 pr-4">
                        <Avatar className="size-10 rounded">
                          <AvatarImage
                            src={s.imageUrl}
                            alt="summit"
                            className="object-cover"
                          />
                          <AvatarFallback className="rounded">
                            🏔
                          </AvatarFallback>
                        </Avatar>
                      </td>
                      <td className="py-2 pr-4">
                        {s.mountainId && s.mountainName ? (
                          <Link
                            href={`/admin/mountains/${s.mountainId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="hover:underline"
                          >
                            {s.mountainName}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-2 pr-4">
                        {s.userId ? (
                          <Link
                            href={`/admin/users/${s.userId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-2 hover:underline"
                          >
                            <Avatar className="size-6">
                              {s.userImageUrl && (
                                <AvatarImage
                                  src={s.userImageUrl}
                                  alt={userName}
                                />
                              )}
                              <AvatarFallback>{userInitials}</AvatarFallback>
                            </Avatar>
                            <span>{userName}</span>
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {s.relatedUsersCount}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {s.validated ? "✓" : "—"}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {formatDate(s.summitedAt)}
                      </td>
                    </tr>
                  );
                })}
                {data.items.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No summits match the current filters.
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
              Page {data.page} of {data.totalPages} · {data.total} summits
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
