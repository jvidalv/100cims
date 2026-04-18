"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useAdminCouponDetail,
  useDeleteAdminCoupon,
  useRedeemAdminCoupon,
  useUpdateAdminCoupon,
} from "@/domains/admin/api";
import { formatDateTime } from "@/lib/format-date";

import { CouponForm, type CouponFormValues } from "../_form";

export default function AdminCouponDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const detail = useAdminCouponDetail(id);
  const update = useUpdateAdminCoupon(id);
  const remove = useDeleteAdminCoupon(id);
  const redeem = useRedeemAdminCoupon(id);

  const [redeemUserId, setRedeemUserId] = useState("");
  const [redeemNote, setRedeemNote] = useState("");

  if (detail.isLoading && !detail.data) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (detail.error || !detail.data) {
    return (
      <div className="p-8 space-y-2">
        <Link
          href="/admin/coupons"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Coupons
        </Link>
        <p className="text-red-600">
          {detail.error?.message ?? "Coupon not found"}
        </p>
      </div>
    );
  }

  const c = detail.data;

  const initial: CouponFormValues = {
    code: c.code,
    discountType: c.discountType,
    discountValue: c.discountValue,
    maxUses: c.maxUses,
    onePerUser: c.onePerUser,
    active: c.active,
  };

  const onDelete = () =>
    remove.mutate(undefined, {
      onSuccess: () => {
        toast.success("Coupon deleted");
        router.push("/admin/coupons");
      },
      onError: (e) =>
        toast.error(e instanceof Error ? e.message : "Delete failed"),
    });

  const onRedeem = () => {
    redeem.mutate(
      {
        userId: redeemUserId.trim(),
        note: redeemNote.trim() || null,
      },
      {
        onSuccess: () => {
          toast.success("Redemption recorded");
          setRedeemUserId("");
          setRedeemNote("");
        },
        onError: (e) =>
          toast.error(e instanceof Error ? e.message : "Redeem failed"),
      },
    );
  };

  return (
    <div className="p-8 space-y-8">
      <div className="space-y-1">
        <Link
          href="/admin/coupons"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Coupons
        </Link>
        <h1 className="text-2xl font-bold font-mono">{c.code}</h1>
        <p className="text-sm text-muted-foreground">
          {c.redemptionCount}
          {c.maxUses != null ? ` / ${c.maxUses}` : " / ∞"} redemptions ·{" "}
          {c.active ? (
            "active"
          ) : (
            <span className="text-rose-600">inactive</span>
          )}
        </p>
      </div>

      <CouponForm
        initial={initial}
        saving={update.isPending}
        saveLabel="Save"
        onSubmitForm={(values) => {
          update.mutate(values, {
            onSuccess: () => toast.success("Saved"),
            onError: (e) =>
              toast.error(e instanceof Error ? e.message : "Update failed"),
          });
        }}
      />

      <section className="space-y-3 max-w-2xl pt-4 border-t">
        <h2 className="text-sm font-medium uppercase tracking-wide">
          Record redemption
        </h2>
        <p className="text-sm text-muted-foreground">
          Manually log that a user redeemed this coupon (phase 1: done by hand
          when an order is fulfilled).
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>User UUID</Label>
            <Input
              value={redeemUserId}
              onChange={(e) => setRedeemUserId(e.target.value)}
              placeholder="00000000-0000-0000-0000-000000000000"
              className="font-mono"
            />
          </div>
          <div className="space-y-1">
            <Label>Note (optional)</Label>
            <Input
              value={redeemNote}
              onChange={(e) => setRedeemNote(e.target.value)}
              placeholder="Order ref, context…"
              maxLength={500}
            />
          </div>
        </div>
        <Button onClick={onRedeem} disabled={redeem.isPending}>
          {redeem.isPending ? "Recording…" : "Record redemption"}
        </Button>
      </section>

      <section className="space-y-3 max-w-3xl pt-4 border-t">
        <h2 className="text-sm font-medium uppercase tracking-wide">
          Redemptions ({c.redemptions.length})
        </h2>
        {c.redemptions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No redemptions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-4 font-medium">User</th>
                  <th className="py-2 pr-4 font-medium">Note</th>
                  <th className="py-2 pr-4 font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {c.redemptions.map((r) => {
                  const name = [r.userFirstName, r.userLastName]
                    .filter(Boolean)
                    .join(" ");
                  return (
                    <tr key={r.id} className="border-b">
                      <td className="py-2 pr-4">
                        <div className="flex flex-col">
                          <span>{name || r.userEmail || r.userId}</span>
                          {name && r.userEmail && (
                            <span className="text-xs text-muted-foreground">
                              {r.userEmail}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {r.note || "—"}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {formatDateTime(r.redeemedAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3 max-w-2xl pt-4 border-t border-destructive/30">
        <h2 className="text-sm font-medium text-destructive uppercase tracking-wide">
          Danger zone
        </h2>
        <p className="text-sm text-muted-foreground">
          Permanently delete this coupon. Recorded redemptions are removed too.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={remove.isPending}>
              Delete coupon
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this coupon?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently removes the coupon and all recorded
                redemptions. Cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={onDelete}
              >
                {remove.isPending ? "Deleting…" : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </div>
  );
}
