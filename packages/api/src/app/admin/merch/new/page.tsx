"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useCreateAdminMerch } from "@/domains/admin/api";

import { MerchForm, emptyMerchForm } from "../_form";

export default function AdminMerchNewPage() {
  const router = useRouter();
  const create = useCreateAdminMerch();

  return (
    <div className="p-8 space-y-6">
      <div className="space-y-1">
        <Link
          href="/admin/merch"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Merch
        </Link>
        <h1 className="text-2xl font-bold">New merch item</h1>
      </div>

      <MerchForm
        initial={emptyMerchForm}
        saving={create.isPending}
        saveLabel="Create"
        onSubmitForm={(values) => {
          create.mutate(
            {
              slug: values.slug,
              nameEn: values.nameEn,
              nameCa: values.nameCa.trim() || null,
              nameEs: values.nameEs.trim() || null,
              descriptionEn: values.descriptionEn.trim() || null,
              descriptionCa: values.descriptionCa.trim() || null,
              descriptionEs: values.descriptionEs.trim() || null,
              shopUrl: values.shopUrl.trim() || null,
              price: values.price,
              discountedPrice: values.discountedPrice,
              hasSize: values.hasSize,
              featured: values.featured,
              active: values.active,
              imageUrls: values.imageUrls,
              variants: values.variants,
            },
            {
              onSuccess: ({ id }) => {
                toast.success("Created");
                router.push(`/admin/merch/${id}`);
              },
              onError: (e) =>
                toast.error(e instanceof Error ? e.message : "Create failed"),
            },
          );
        }}
      />
    </div>
  );
}
