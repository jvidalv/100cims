"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useCreateAdminCoupon } from "@/domains/admin/api";

import { CouponForm, emptyCouponForm } from "../_form";

export default function AdminCouponNewPage() {
  const router = useRouter();
  const create = useCreateAdminCoupon();

  return (
    <div className="p-8 space-y-6">
      <div className="space-y-1">
        <Link
          href="/admin/coupons"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Coupons
        </Link>
        <h1 className="text-2xl font-bold">New coupon</h1>
      </div>

      <CouponForm
        initial={emptyCouponForm}
        saving={create.isPending}
        saveLabel="Create"
        onSubmitForm={(values) => {
          create.mutate(values, {
            onSuccess: ({ id }) => {
              toast.success("Created");
              router.push(`/admin/coupons/${id}`);
            },
            onError: (e) =>
              toast.error(e instanceof Error ? e.message : "Create failed"),
          });
        }}
      />
    </div>
  );
}
