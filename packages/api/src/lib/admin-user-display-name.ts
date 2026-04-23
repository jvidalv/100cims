type AdminUserNameFields = {
  id: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
};

/**
 * Best-effort display name for admin UI rows: username, then full name,
 * then a short id fallback. Mirrors how `admin/users/[id]/page.tsx` and
 * the admin ratings list render a user handle.
 */
export const getAdminUserDisplayName = (user: AdminUserNameFields): string => {
  if (user.username) return user.username;
  const full = [user.firstName, user.lastName].filter(Boolean).join(" ");
  if (full) return full;
  return user.id.slice(0, 8);
};
