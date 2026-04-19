"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use } from "react";
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
import {
  useAdminMerchDetail,
  useDeleteAdminMerch,
  useUpdateAdminMerch,
} from "@/domains/admin/api";

import { MerchForm, type MerchFormValues } from "../_form";

export default function AdminMerchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const detail = useAdminMerchDetail(id);
  const update = useUpdateAdminMerch(id);
  const remove = useDeleteAdminMerch(id);

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
          href="/admin/merch"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Merch
        </Link>
        <p className="text-red-600">
          {detail.error?.message ?? "Merch not found"}
        </p>
      </div>
    );
  }

  const m = detail.data;

  const initial: MerchFormValues = {
    slug: m.slug,
    nameEn: m.nameEn,
    nameCa: m.nameCa ?? "",
    nameEs: m.nameEs ?? "",
    descriptionEn: m.descriptionEn ?? "",
    descriptionCa: m.descriptionCa ?? "",
    descriptionEs: m.descriptionEs ?? "",
    shopUrl: m.shopUrl ?? "",
    price: m.price,
    discountedPrice: m.discountedPrice,
    sizes: m.sizes,
    featured: m.featured,
    active: m.active,
    imageUrls: m.imageUrls,
    variants: m.variants.map((v) => ({
      color: v.color,
      imageUrls: v.imageUrls,
    })),
  };

  const onDelete = () =>
    remove.mutate(undefined, {
      onSuccess: () => {
        toast.success("Merch deleted");
        router.push("/admin/merch");
      },
      onError: (e) =>
        toast.error(e instanceof Error ? e.message : "Delete failed"),
    });

  return (
    <div className="p-8 space-y-8">
      <div className="space-y-1">
        <Link
          href="/admin/merch"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Merch
        </Link>
        <h1 className="text-2xl font-bold">{m.nameEn}</h1>
        <p className="text-sm text-muted-foreground font-mono">{m.slug}</p>
      </div>

      <MerchForm
        initial={initial}
        saving={update.isPending}
        saveLabel="Save"
        slugLocked
        onSubmitForm={(values) => {
          update.mutate(
            {
              nameEn: values.nameEn,
              nameCa: values.nameCa.trim() || null,
              nameEs: values.nameEs.trim() || null,
              descriptionEn: values.descriptionEn.trim() || null,
              descriptionCa: values.descriptionCa.trim() || null,
              descriptionEs: values.descriptionEs.trim() || null,
              shopUrl: values.shopUrl.trim() || null,
              price: values.price,
              discountedPrice: values.discountedPrice,
              sizes: values.sizes,
              featured: values.featured,
              active: values.active,
              imageUrls: values.imageUrls,
              variants: values.variants,
            },
            {
              onSuccess: () => toast.success("Saved"),
              onError: (e) =>
                toast.error(e instanceof Error ? e.message : "Update failed"),
            },
          );
        }}
      />

      <section className="space-y-3 max-w-2xl pt-4 border-t border-destructive/30">
        <h2 className="text-sm font-medium text-destructive uppercase tracking-wide">
          Danger zone
        </h2>
        <p className="text-sm text-muted-foreground">
          Permanently delete this merch item. This cannot be undone.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={remove.isPending}>
              Delete merch
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this merch?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently removes the item. Cannot be undone.
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
