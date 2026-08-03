import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

declare global {
  var __pgClient: ReturnType<typeof postgres> | undefined;
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

// Reused across hot reloads in dev, and across invocations of the same
// serverless function instance in production, instead of opening a new
// connection per module load.
const client =
  globalThis.__pgClient ??
  postgres(connectionString, {
    // Supabase's pooled (pgbouncer, "Transaction" mode) connection on port
    // 6543 does not support session-level prepared statements.
    prepare: false,
    max: 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__pgClient = client;
}

export const db = drizzle(client, { schema });
