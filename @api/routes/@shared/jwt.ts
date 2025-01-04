import { jwt } from "@elysiajs/jwt";

export const JWT = () =>
  jwt({
    name: "jwt",
    secret: "1f5429fb-ce45-4fb2-bf7d-c17bc449f059",
  });
