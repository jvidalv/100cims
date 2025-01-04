import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

export const postgresClient = postgres(process.env.DATABASE_URL || "", {
  idle_timeout: 20,
  max_lifetime: 60 * 30,
  prepare: false,
});

export const db = drizzle({ client: postgresClient, casing: "snake_case" });
