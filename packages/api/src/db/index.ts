import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

export const postgresClient = postgres(process.env.DATABASE_URL || "", {
  idle_timeout: 20,
  max_lifetime: 60 * 30,
  prepare: false,
});

export const db = drizzle({ client: postgresClient, casing: "snake_case" });

/**
 * Either the top-level `db` or a transaction handle. Use as the executor
 * parameter for helpers that need to run inside a caller's transaction.
 */
export type DbOrTx =
  | typeof db
  | Parameters<Parameters<typeof db.transaction>[0]>[0];
