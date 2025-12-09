import 'dotenv/config';
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

console.log('🔍 Testing database connection...\n');

const client = postgres(databaseUrl);
const db = drizzle(client, { schema });

async function testConnection() {
  try {
    // Test 1: Basic connection
    console.log('1️⃣ Testing basic connection...');
    await client`SELECT 1`;
    console.log('   ✅ Connection successful\n');

    // Test 2: Count users
    console.log('2️⃣ Checking users table...');
    const userCount = await db.select().from(schema.users);
    console.log(`   ✅ Found ${userCount.length} user(s)`);
    if (userCount.length > 0) {
      console.log(`   📋 Users: ${userCount.map(u => u.username).join(', ')}\n`);
    }

    // Test 3: Count applications
    console.log('3️⃣ Checking applications table...');
    const appCount = await db.select().from(schema.applications);
    console.log(`   ✅ Found ${appCount.length} application(s)`);
    if (appCount.length > 0) {
      const statusCounts = appCount.reduce((acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
      }, {});
      console.log(`   📊 Status breakdown:`, statusCounts);
      console.log(`   📋 Sample apps: ${appCount.slice(0, 5).map(a => a.name).join(', ')}${appCount.length > 5 ? '...' : ''}\n`);
    }

    // Test 4: Count requests
    console.log('4️⃣ Checking requests table...');
    const requestCount = await db.select().from(schema.requests);
    console.log(`   ✅ Found ${requestCount.length} request(s)\n`);

    // Test 5: Count activity logs
    console.log('5️⃣ Checking activity logs table...');
    const logCount = await db.select().from(schema.activityLogs);
    console.log(`   ✅ Found ${logCount.length} activity log(s)\n`);

    // Summary
    console.log('='.repeat(50));
    console.log('✅ Database connection test PASSED!\n');
    console.log('📊 Database Summary:');
    console.log(`   👥 Users: ${userCount.length}`);
    console.log(`   📱 Applications: ${appCount.length}`);
    console.log(`   📝 Requests: ${requestCount.length}`);
    console.log(`   📊 Activity Logs: ${logCount.length}`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('\n❌ Database connection test FAILED!');
    console.error('Error:', error.message);
    if (error instanceof Error) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  } finally {
    await client.end();
    process.exit(0);
  }
}

testConnection();


