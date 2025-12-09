
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";

// Lazy initialization - only connect when actually used
let _client: ReturnType<typeof postgres> | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

function getClient() {
  if (!_client) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required for PostgreSQL connection. Please create a .env file with DATABASE_URL=postgres://...');
    }
    _client = postgres(databaseUrl);
    _db = drizzle(_client, { schema });
  }
  return _client;
}

function getDb() {
  if (!_db) {
    getClient(); // This will initialize both client and db
  }
  if (!_db) {
    throw new Error('Database initialization failed');
  }
  return _db;
}

// Export db with lazy initialization
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    const dbInstance = getDb();
    const value = dbInstance[prop as keyof typeof dbInstance];
    if (typeof value === 'function') {
      return value.bind(dbInstance);
    }
    return value;
  }
});

// Export client getter (lazy - doesn't connect until used)
export const getClientInstance = () => getClient();
