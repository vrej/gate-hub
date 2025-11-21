
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";

// Use PostgreSQL if DATABASE_URL is available, otherwise log warning
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required for PostgreSQL connection');
}

// Create postgres connection
const client = postgres(databaseUrl);
export const db = drizzle(client, { schema });

// For backwards compatibility, also export a simple client
export { client };
