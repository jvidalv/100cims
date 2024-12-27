import { Elysia } from "elysia";
import { publicRoutes } from "@/api/routes/public";
import { protectedRoutes } from "@/api/routes/protected";

export const app = new Elysia({ prefix: "/api" })
  .use(publicRoutes)
  .use(protectedRoutes);

export type App = typeof app;
