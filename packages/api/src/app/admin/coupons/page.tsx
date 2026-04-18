"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useAdminCoupons } from "@/domains/admin/api";
import { formatDate } from "@/lib/format-date";

const formatDiscount = (type: "percentage" | "fixed", value: number): string =>
  type === "percentage" ? `${value}%` : `${value}€ off`;

const formatUses = (used: number, max: number | null): string =>
  max == null ? `${used} / ∞` : `${used} / ${max}`;

export default function AdminCouponsPage() {
  const router = useRouter();
  const { data, error, isLoading } = useAdminCoupons();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Coupons</h1>
        <Button asChild>
          <Link href="/admin/coupons/new">New coupon</Link>
        </Button>
      </div>

      {error && <p className="text-red-600 mb-4">{error.message}</p>}
      {isLoading && !data && <p className="text-muted-foreground">Loading…</p>}

      {data && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 pr-4 font-medium">Code</th>
                <th className="py-2 pr-4 font-medium">Discount</th>
                <th className="py-2 pr-4 font-medium">Uses</th>
                <th className="py-2 pr-4 font-medium">One per user</th>
                <th className="py-2 pr-4 font-medium">Active</th>
                <th className="py-2 pr-4 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((c) => (
                <tr
                  key={c.id}
                  className="border-b hover:bg-muted/40 cursor-pointer"
                  onClick={() => router.push(`/admin/coupons/${c.id}`)}
                >
                  <td className="py-2 pr-4 font-mono font-medium">{c.code}</td>
                  <td className="py-2 pr-4">
                    {formatDiscount(c.discountType, c.discountValue)}
                  </td>
                  <td className="py-2 pr-4">
                    {formatUses(c.redemptionCount, c.maxUses)}
                  </td>
                  <td className="py-2 pr-4 text-muted-foreground">
                    {c.onePerUser ? "Yes" : "—"}
                  </td>
                  <td className="py-2 pr-4">
                    {c.active ? (
                      "Yes"
                    ) : (
                      <span className="text-rose-600">No</span>
                    )}
                  </td>
                  <td className="py-2 pr-4 text-muted-foreground">
                    {formatDate(c.updatedAt)}
                  </td>
                </tr>
              ))}
              {data.items.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No coupons yet.
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
