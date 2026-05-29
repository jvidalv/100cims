import { useAdminUsers } from "@/domains/admin/api";

// Adapter that maps the admin users-list query into the SearchPicker's
// `{ items, isLoading }` shape. Gated on a non-empty query so the picker
// doesn't fire a network request on every mount — matches the mountain
// adapter's behaviour. The picker shows "type to search…" until the
// admin starts typing.
export const useUserSearch = (q: string) => {
  const { data, isLoading } = useAdminUsers(
    {
      page: 1,
      q,
      country: "",
      platform: "",
      version: "",
      sort: "",
    },
    { enabled: q.trim().length > 0 },
  );
  // Picker expects an `id` field on each item. The admin users list returns
  // `id` already, so no remap needed — but we narrow to just the fields the
  // picker uses to keep the rendered option types tight.
  const items =
    data?.items.map((u) => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      username: u.username,
      email: u.email,
      imageUrl: u.imageUrl,
    })) ?? [];
  return { items, isLoading };
};
