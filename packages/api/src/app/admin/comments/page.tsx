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
import { useAdminCommentsList } from "@/domains/admin/api";
import { formatDate } from "@/lib/format-date";

export default function AdminCommentsPage() {
  const router = useRouter();
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [q, setQ] = useQueryState("q", parseAsString.withDefault(""));
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

  const { data, error, isLoading } = useAdminCommentsList({ page, q, sort });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Comments</h1>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Input
          type="search"
          placeholder="Search by body or mountain…"
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
            <SelectItem value="upvotes_desc">Most upvotes</SelectItem>
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
                  <th className="py-2 pr-4 font-medium">Author</th>
                  <th className="py-2 pr-4 font-medium">Mountain</th>
                  <th className="py-2 pr-4 font-medium">Body</th>
                  <th className="py-2 pr-4 font-medium">Photos</th>
                  <th className="py-2 pr-4 font-medium text-right">Upvotes</th>
                  <th className="py-2 pr-4 font-medium">Reply</th>
                  <th className="py-2 pr-4 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((c) => {
                  const authorName =
                    [c.user.firstName, c.user.lastName]
                      .filter(Boolean)
                      .join(" ") ||
                    c.user.username ||
                    c.user.email;
                  const authorInitials = (
                    c.user.firstName?.[0] ?? c.user.email[0]
                  ).toUpperCase();
                  const mountainInitials = c.mountain.name
                    .slice(0, 2)
                    .toUpperCase();
                  return (
                    <tr
                      key={c.id}
                      className="border-b hover:bg-muted/40 cursor-pointer"
                      onClick={() => router.push(`/admin/comments/${c.id}`)}
                    >
                      <td className="py-2 pr-4">
                        <Link
                          href={`/admin/users/${c.user.id}`}
                          className="flex items-center gap-2 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Avatar className="size-6">
                            {c.user.imageUrl && (
                              <AvatarImage
                                src={c.user.imageUrl}
                                alt={authorName}
                              />
                            )}
                            <AvatarFallback>{authorInitials}</AvatarFallback>
                          </Avatar>
                          <span>{authorName}</span>
                        </Link>
                      </td>
                      <td className="py-2 pr-4">
                        <Link
                          href={`/admin/mountains/${c.mountain.id}`}
                          className="flex items-center gap-2 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Avatar className="size-6">
                            {c.mountain.imageUrl && (
                              <AvatarImage
                                src={c.mountain.imageUrl}
                                alt={c.mountain.name}
                              />
                            )}
                            <AvatarFallback>{mountainInitials}</AvatarFallback>
                          </Avatar>
                          <span>{c.mountain.name}</span>
                        </Link>
                      </td>
                      <td className="py-2 pr-4 max-w-md">
                        <p className="line-clamp-2 whitespace-pre-wrap">
                          {c.body}
                        </p>
                      </td>
                      <td className="py-2 pr-4">
                        {c.images.length > 0 ? (
                          <div className="flex items-center gap-1">
                            {c.images.slice(0, 5).map((img, i) => (
                              <a
                                key={i}
                                href={img.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="block size-10 overflow-hidden rounded border"
                              >
                                <img
                                  src={img.url}
                                  alt=""
                                  width={40}
                                  height={40}
                                  className="size-full object-cover"
                                />
                              </a>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground text-right tabular-nums">
                        {c.upvoteCount}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {c.parentCommentId ? "↳" : "—"}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {formatDate(c.createdAt)}
                      </td>
                    </tr>
                  );
                })}
                {data.items.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No comments match “{q}”.
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
              Page {data.page} of {data.totalPages} · {data.total} comments
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
