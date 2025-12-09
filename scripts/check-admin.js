import 'dotenv/config';
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema";
import { eq, or } from "drizzle-orm";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

// Create postgres connection
const client = postgres(databaseUrl);
const db = drizzle(client, { schema });

async function checkAdmin() {
  try {
    // Find all admin users
    const allUsers = await db.select().from(schema.users);
    const adminUsers = allUsers.filter(u => u.isAdmin === true || u.username === 'admin');
    
    console.log('\n🔍 Checking for admin users...\n');
    
    if (adminUsers.length === 0) {
      console.log('❌ No admin users found in database.');
      console.log('\n💡 Run: npm run db:reset-admin to create/reset admin user');
    } else {
      console.log(`✅ Found ${adminUsers.length} admin user(s):\n`);
      adminUsers.forEach((user, index) => {
        console.log(`Admin User #${index + 1}:`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Admin Status: ${user.isAdmin ? '✅ Yes' : '❌ No'}`);
        console.log(`   ID: ${user.id}`);
        console.log('');
      });
      
      console.log('💡 To login, use:');
      console.log('   - Username: admin');
      console.log('   - OR Email: (one of the emails above)');
      console.log('   - Password: (check which script was used)');
      console.log('\n   If you used db:seed → password: password123');
      console.log('   If you used db:create-admin → password: admin123');
      console.log('\n   To reset password: npm run db:reset-admin');
    }
    
    console.log('\n' + '='.repeat(50));
    
  } catch (error) {
    console.error('\n❌ Error checking admin users:', error);
    process.exit(1);
  } finally {
    await client.end();
    process.exit(0);
  }
}

checkAdmin();


