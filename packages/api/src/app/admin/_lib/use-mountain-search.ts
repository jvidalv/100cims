import { useAdminMountains } from "@/domains/admin/api";

export const useMountainSearch = (q: string) => {
  const { data, isLoading } = useAdminMountains(
    { page: 1, q, sort: "" },
    { enabled: q.trim().length > 0 },
  );
  return { items: data?.items ?? [], isLoading };
};
