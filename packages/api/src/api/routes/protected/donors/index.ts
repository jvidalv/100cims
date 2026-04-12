import { Elysia } from "elysia";

import { donorAllGetRoute } from "@/api/routes/protected/donors/donor.all.get";
import { donorCreatePostRoute } from "@/api/routes/protected/donors/donor.create.post";
import { donorCurrentMonthGetRoute } from "@/api/routes/protected/donors/donor.current-month.get";

export const donorsRoute = new Elysia({ prefix: "/donors" })
  .use(donorAllGetRoute)
  .use(donorCurrentMonthGetRoute)
  .use(donorCreatePostRoute);
