"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminOrganizations } from "@/domains/admin/api";
import { formatDate } from "@/lib/format-date";

export default function AdminOrganizationsPage() {
  const router = useRouter();
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [q, setQ] = useQueryState("q", parseAsString.withDefault(""));
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

  const { data, error, isLoading } = useAdminOrganizations({ page, q });

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Organizations</h1>
        <Button asChild>
          <Link href="/admin/organizations/new">New organization</Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <Input
          type="search"
          placeholder="Search by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {error && <p className="text-red-600 mb-4">{error.message}</p>}
      {isLoading && !data && <p className="text-muted-foreground">Loading…</p>}

      {data && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-4 font-medium">Logo</th>
                  <th className="py-2 pr-4 font-medium">Name</th>
                  <th className="py-2 pr-4 font-medium">Members</th>
                  <th className="py-2 pr-4 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((o) => (
                  <tr
                    key={o.id}
                    className="border-b hover:bg-muted/40 cursor-pointer"
                    onClick={() => router.push(`/admin/organizations/${o.id}`)}
                  >
                    <td className="py-2 pr-4">
                      {o.imageUrl ? (
                        <img
                          src={o.imageUrl}
                          alt=""
                          className="size-10 rounded object-cover"
                        />
                      ) : (
                        <div className="size-10 rounded bg-muted flex items-center justify-center text-lg">
                          🏔️
                        </div>
                      )}
                    </td>
                    <td className="py-2 pr-4">
                      <div className="font-medium">{o.name}</div>
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground font-mono">
                      {o.memberCount}
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {formatDate(o.createdAt)}
                    </td>
                  </tr>
                ))}
                {data.items.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No organizations yet.
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
              Page {data.page} of {data.totalPages} · {data.total} organizations
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
