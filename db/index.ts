import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/db/schema";
import { getServerEnv } from "@/lib/env";

const globalForDatabase = globalThis as typeof globalThis & {
  cervecerdasPostgres?: ReturnType<typeof postgres>;
};

const client =
  globalForDatabase.cervecerdasPostgres ??
  postgres(getServerEnv().DATABASE_URL, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDatabase.cervecerdasPostgres = client;
}

export const db = drizzle(client, { schema });
