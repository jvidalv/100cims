import { and, asc, eq, inArray } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import {
  mountainTable,
  organizationTable,
  planHasMountainsTable,
  planHasUsersTable,
  planTable,
  userTable,
} from "@/db/schema";
import { JWT } from "@/api/routes/@shared/jwt";
import {
  getBearerToken,
  getOptionalUserId,
} from "@/api/routes/@shared/optional-auth";
import { planVisibilitySql } from "@/api/routes/@shared/plan-access";
import {
  assemblePlanOrganization,
  planOrganizationSelection,
  planParticipantsOrderBy,
} from "@/api/routes/@shared/plan-organization";
import { SuccessResponse } from "@/api/schemas/common.schema";
import { PlansArraySchema } from "@/api/schemas/plan.schema";

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 20;

/**
 * Admin-curated featured open plans. Drives the "Featured" rail on the
 * mobile home page, which then merges these with the upcoming-plans list
 * (deduped by id). Kept as a separate endpoint instead of folding
 * `featured-first` into `/plans/all` so the existing endpoints keep
 * their stable sort contract — old mobile clients don't see a
 * re-ordering when an admin marks a plan featured.
 *
 * Response shape mirrors `/api/public/plans/all` so consumers can drop
 * results into the same `PlanItemList` component without remapping.
 */
export const planFeaturedGetRoute = new Elysia().use(JWT()).get(
  "/featured",
  async ({ query, jwt, headers }) => {
    const viewerId = await getOptionalUserId(jwt, getBearerToken(headers));
    const limit = Math.min(query?.limit ?? DEFAULT_LIMIT, MAX_LIMIT);

    const plans = await db
      .select({
        id: planTable.id,
        title: planTable.title,
        description: planTable.description,
        imageUrl: planTable.imageUrl,
        speed: planTable.speed,
        type: planTable.type,
        status: planTable.status,
        routeUrl: planTable.routeUrl,
        whatsappGroupUrl: planTable.whatsappGroupUrl,
        wikilocUrl: planTable.wikilocUrl,
        stravaUrl: planTable.stravaUrl,
        startDate: planTable.startDate,
        startTime: planTable.startTime,
        creatorId: planTable.creatorId,
        createdAt: planTable.createdAt,
        updatedAt: planTable.updatedAt,
        challengeId: planTable.challengeId,
        isPrivate: planTable.isPrivate,
        featured: planTable.featured,
        ...planOrganizationSelection,
      })
      .from(planTable)
      .leftJoin(
        organizationTable,
        eq(planTable.organizationId, organizationTable.id),
      )
      .where(
        and(
          eq(planTable.featured, true),
          eq(planTable.status, "open"),
          planVisibilitySql(viewerId),
        ),
      )
      // Soonest featured plans first. No-startDate plans land last (NULL
      // sorts last under ASC in Postgres by default).
      .orderBy(asc(planTable.startDate))
      .limit(limit);

    const planIds = plans.map((p) => p.id);
    const [users, mountains] = await Promise.all([
      planIds.length
        ? db
            .select({
              planId: planHasUsersTable.planId,
              userId: userTable.id,
              firstName: userTable.firstName,
              lastName: userTable.lastName,
              imageUrl: userTable.imageUrl,
              willBringDogs: planHasUsersTable.willBringDogs,
              role: planHasUsersTable.role,
            })
            .from(planHasUsersTable)
            .innerJoin(userTable, eq(planHasUsersTable.userId, userTable.id))
            .where(inArray(planHasUsersTable.planId, planIds))
            .orderBy(...planParticipantsOrderBy())
        : Promise.resolve([]),

      planIds.length
        ? db
            .select({
              planId: planHasMountainsTable.planId,
              mountainId: mountainTable.id,
              name: mountainTable.name,
              slug: mountainTable.slug,
              imageUrl: mountainTable.imageUrl,
              location: mountainTable.location,
              height: mountainTable.height,
            })
            .from(planHasMountainsTable)
            .innerJoin(
              mountainTable,
              eq(planHasMountainsTable.mountainId, mountainTable.id),
            )
            .where(inArray(planHasMountainsTable.planId, planIds))
        : Promise.resolve([]),
    ]);

    // Bucket once into Maps so the per-plan lookup below is O(1) — mirrors
    // plan.all-paginated.get.ts to keep the four list endpoints' hot paths
    // consistent.
    const usersByPlan = new Map<
      string,
      {
        id: string;
        firstName: string | null;
        lastName: string | null;
        imageUrl: string | null;
        willBringDogs: boolean;
        role: "member" | "organizer";
      }[]
    >();
    for (const u of users) {
      if (!u.planId) continue;
      const list = usersByPlan.get(u.planId) ?? [];
      list.push({
        id: u.userId,
        firstName: u.firstName,
        lastName: u.lastName,
        imageUrl: u.imageUrl,
        willBringDogs: u.willBringDogs,
        role: u.role,
      });
      usersByPlan.set(u.planId, list);
    }

    const mountainsByPlan = new Map<
      string,
      {
        id: string;
        name: string;
        slug: string;
        imageUrl: string | null;
        location: string;
        height: string;
      }[]
    >();
    for (const m of mountains) {
      if (!m.planId) continue;
      const list = mountainsByPlan.get(m.planId) ?? [];
      list.push({
        id: m.mountainId,
        name: m.name,
        slug: m.slug,
        imageUrl: m.imageUrl,
        location: m.location,
        height: m.height,
      });
      mountainsByPlan.set(m.planId, list);
    }

    const plansWithRelations = plans.map((plan) => {
      const {
        organizationId,
        organizationName,
        organizationImageUrl,
        ...planFields
      } = plan;
      return {
        ...planFields,
        users: usersByPlan.get(plan.id) ?? [],
        mountains: mountainsByPlan.get(plan.id) ?? [],
        organization: assemblePlanOrganization({
          organizationId,
          organizationName,
          organizationImageUrl,
        }),
      };
    });

    return { success: true, message: plansWithRelations };
  },
  {
    query: t.Optional(
      t.Object({
        limit: t.Optional(t.Number()),
      }),
    ),
    response: SuccessResponse(PlansArraySchema),
  },
);
