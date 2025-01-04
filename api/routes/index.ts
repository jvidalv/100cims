import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";

// import { postgresClient } from "@/api/db";
import { protectedRoutes } from "@/api/routes/protected";
import { publicRoutes } from "@/api/routes/public";

export const app = new Elysia({ prefix: "/api" })
  .use(cors())
  // .onAfterHandle(() => {
  //   void postgresClient.end();
  // })
  .use(publicRoutes)
  .use(protectedRoutes);

export type App = typeof app;
