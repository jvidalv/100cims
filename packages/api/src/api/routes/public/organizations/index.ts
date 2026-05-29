import { Elysia } from "elysia";

import { organizationOneGetRoute } from "@/api/routes/public/organizations/organization.one.get";

export const publicOrganizationsRoute = new Elysia({
  prefix: "/organizations",
}).use(organizationOneGetRoute);
