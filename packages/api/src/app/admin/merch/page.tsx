"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useAdminMerch } from "@/domains/admin/api";
import { formatDate } from "@/lib/format-date";

export default function AdminMerchPage() {
  const router = useRouter();
  const { data, error, isLoading } = useAdminMerch();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Merch</h1>
        <Button asChild>
          <Link href="/admin/merch/new">New merch item</Link>
        </Button>
      </div>

      {error && <p className="text-red-600 mb-4">{error.message}</p>}
      {isLoading && !data && <p className="text-muted-foreground">Loading…</p>}

      {data && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 pr-4 font-medium">Image</th>
                <th className="py-2 pr-4 font-medium">Slug</th>
                <th className="py-2 pr-4 font-medium">Name</th>
                <th className="py-2 pr-4 font-medium">Price</th>
                <th className="py-2 pr-4 font-medium">Size</th>
                <th className="py-2 pr-4 font-medium">Featured</th>
                <th className="py-2 pr-4 font-medium">Active</th>
                <th className="py-2 pr-4 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((m) => (
                <tr
                  key={m.id}
                  className="border-b hover:bg-muted/40 cursor-pointer"
                  onClick={() => router.push(`/admin/merch/${m.id}`)}
                >
                  <td className="py-2 pr-4">
                    {m.imageUrls[0] ? (
                      <img
                        src={m.imageUrls[0]}
                        alt=""
                        className="size-10 rounded object-cover"
                      />
                    ) : (
                      <div className="size-10 rounded bg-muted flex items-center justify-center text-xs">
                        🛍
                      </div>
                    )}
                  </td>
                  <td className="py-2 pr-4 font-mono">{m.slug}</td>
                  <td className="py-2 pr-4 font-medium">{m.nameEn}</td>
                  <td className="py-2 pr-4">{m.price}€</td>
                  <td className="py-2 pr-4 text-muted-foreground">
                    {m.hasSize ? "Yes" : "—"}
                  </td>
                  <td className="py-2 pr-4">
                    {m.featured != null ? (
                      <span className="inline-flex items-center rounded bg-sky-100 text-sky-900 dark:bg-sky-900/30 dark:text-sky-300 px-2 py-0.5 text-xs font-medium">
                        #{m.featured}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="py-2 pr-4">
                    {m.active ? (
                      "Yes"
                    ) : (
                      <span className="text-rose-600">No</span>
                    )}
                  </td>
                  <td className="py-2 pr-4 text-muted-foreground">
                    {formatDate(m.updatedAt)}
                  </td>
                </tr>
              ))}
              {data.items.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No merch items yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
