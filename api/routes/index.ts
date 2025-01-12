import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";

import { protectedRoutes } from "@/api/routes/protected";
import { publicRoutes } from "@/api/routes/public";

export const app = new Elysia({ prefix: "/api" })
  .use(cors())
  .use(publicRoutes)
  .use(protectedRoutes);

export type App = typeof app;
