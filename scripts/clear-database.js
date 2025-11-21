import 'dotenv/config';
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema";
import { sql } from "drizzle-orm";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

// Create postgres connection
const client = postgres(databaseUrl);
const db = drizzle(client, { schema });

console.log('🗑️  Clearing database...\n');

async function clearDatabase() {
  try {
    // Delete in reverse order due to foreign key constraints
    console.log('Deleting activity logs...');
    await db.delete(schema.activityLogs);
    
    console.log('Deleting requests...');
    await db.delete(schema.requests);
    
    console.log('Deleting applications...');
    await db.delete(schema.applications);
    
    console.log('Deleting users...');
    await db.delete(schema.users);
    
    console.log('\n✅ Database cleared successfully!');
  } catch (error) {
    console.error('\n❌ Error clearing database:', error);
    process.exit(1);
  } finally {
    await client.end();
    process.exit(0);
  }
}

clearDatabase();

