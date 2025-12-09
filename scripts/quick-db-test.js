import 'dotenv/config';
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL not set');
  process.exit(1);
}

console.log('Testing database...');
const client = postgres(databaseUrl);
const db = drizzle(client, { schema });

try {
  const users = await db.select().from(schema.users);
  const apps = await db.select().from(schema.applications);
  console.log(`✅ Connected! Users: ${users.length}, Apps: ${apps.length}`);
} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  await client.end();
}


