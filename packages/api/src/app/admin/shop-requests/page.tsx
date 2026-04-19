"use client";

import { useRouter } from "next/navigation";

import { useAdminShopRequests } from "@/domains/admin/api";
import { formatDate } from "@/lib/format-date";

type Status = "requested" | "contacted" | "done" | "cancelled";

const STATUS_STYLES: Record<Status, string> = {
  requested: "bg-amber-100 text-amber-900",
  contacted: "bg-sky-100 text-sky-900",
  done: "bg-emerald-100 text-emerald-900",
  cancelled: "bg-neutral-200 text-neutral-700",
};

const truncate = (input: string, max = 60) =>
  input.length <= max ? input : `${input.slice(0, max).trimEnd()}…`;

export default function AdminShopRequestsPage() {
  const router = useRouter();
  const { data, error, isLoading } = useAdminShopRequests();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Shop requests</h1>

      {error && <p className="text-red-600 mb-4">{error.message}</p>}
      {isLoading && !data && <p className="text-muted-foreground">Loading…</p>}

      {data && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 pr-4 font-medium">Received</th>
                <th className="py-2 pr-4 font-medium">Email</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">Preview</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((r) => (
                <tr
                  key={r.id}
                  className="border-b hover:bg-muted/40 cursor-pointer"
                  onClick={() => router.push(`/admin/shop-requests/${r.id}`)}
                >
                  <td className="py-2 pr-4 text-muted-foreground whitespace-nowrap">
                    {formatDate(r.createdAt)}
                  </td>
                  <td className="py-2 pr-4">{r.userEmail}</td>
                  <td className="py-2 pr-4">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[r.status]}`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-muted-foreground">
                    {truncate(r.message)}
                  </td>
                </tr>
              ))}
              {data.items.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No requests yet.
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
