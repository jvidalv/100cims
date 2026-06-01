import { Elysia } from "elysia";

import { challengeMyProgressGetRoute } from "@/api/routes/protected/challenge/my-progress.get";

export const challengeRoutes = new Elysia({ prefix: "/challenge" }).use(
  challengeMyProgressGetRoute,
);
