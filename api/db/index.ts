import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const client = postgres(process.env.DATABASE_URL || "", { prepare: false });

export const db = drizzle({ client, casing: "snake_case" });
