import { jwt } from "@elysiajs/jwt";

export const JWT = () =>
  jwt({
    name: "jwt",
    secret: process.env.AUTH_SECRET as string,
  });
