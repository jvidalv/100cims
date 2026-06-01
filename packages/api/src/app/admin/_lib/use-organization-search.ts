import { useAdminOrganizations } from "@/domains/admin/api";

// Adapter that maps the admin orgs list into the SearchPicker's
// `{ items, isLoading }` shape. Gated on a non-empty query so the picker
// doesn't fire a network request on every mount — matches the other
// `_lib/use-*-search.ts` adapters.
export const useOrganizationSearch = (q: string) => {
  const { data, isLoading } = useAdminOrganizations(
    { page: 1, q },
    { enabled: q.trim().length > 0 },
  );
  return { items: data?.items ?? [], isLoading };
};
