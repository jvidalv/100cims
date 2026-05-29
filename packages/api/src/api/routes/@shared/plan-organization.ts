import { desc, sql } from "drizzle-orm";

import { organizationTable, planHasUsersTable } from "@/db/schema";

/**
 * Drizzle column refs for the org-on-plan LEFT JOIN. Spread into a
 * `db.select({...})` alongside the plan columns so each plan row carries
 * three nullable org fields. Use `assemblePlanOrganization` on the result
 * to collapse them back into a `{ id, name, imageUrl } | null`.
 *
 * Lives here (and not inline in each route) because the three public plan
 * endpoints — `plan.one`, `plan.all`, `plan.all-paginated` — all need the
 * same shape, and a future drift between them would silently break the
 * mobile "Hosted by" row on one endpoint while leaving the others working.
 */
export const planOrganizationSelection = {
  organizationId: organizationTable.id,
  organizationName: organizationTable.name,
  organizationImageUrl: organizationTable.imageUrl,
} as const;

/**
 * Collapse the three column-prefixed fields into the nested
 * `organization` object the mobile app expects (or `null` if the plan
 * has no hosting organization, including the cascade-set-null case
 * where the org was deleted but the plan stayed alive).
 */
export const assemblePlanOrganization = (plan: {
  organizationId: string | null;
  organizationName: string | null;
  organizationImageUrl: string | null;
}): { id: string; name: string; imageUrl: string | null } | null => {
  if (!plan.organizationId || !plan.organizationName) return null;
  return {
    id: plan.organizationId,
    name: plan.organizationName,
    imageUrl: plan.organizationImageUrl,
  };
};

/**
 * Deterministic participant order shared by every plan-list endpoint:
 * organizers first, then most-recently-joined within each role. Keeps the
 * mobile UI consistent (AvatarGroup, plan-detail list, calendar rows) and
 * removes the need for any client-side resort.
 */
export const planParticipantsOrderBy = () =>
  [
    desc(sql`${planHasUsersTable.role} = 'organizer'`),
    desc(planHasUsersTable.joinedAt),
  ] as const;
