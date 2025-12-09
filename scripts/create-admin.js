import 'dotenv/config';
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

// Create postgres connection
const client = postgres(databaseUrl);
const db = drizzle(client, { schema });

console.log('🔐 Creating admin user...\n');

async function createAdmin() {
  try {
    // Check if admin user already exists
    const existingAdmin = await db.select()
      .from(schema.users)
      .where(eq(schema.users.username, 'admin'))
      .limit(1);

    if (existingAdmin.length > 0) {
      console.log('⚠️  Admin user already exists!');
      console.log('\n📋 Existing admin credentials:');
      console.log('   Username: admin');
      console.log('   Email: ' + existingAdmin[0].email);
      console.log('   Admin status: ' + (existingAdmin[0].isAdmin ? '✅ Yes' : '❌ No'));
      console.log('\n💡 If you need to reset the password, you can:');
      console.log('   1. Delete the existing admin user from the database');
      console.log('   2. Run this script again');
      console.log('   3. Or manually update the password in the database');
    } else {
      // Create admin user
      const defaultPassword = 'admin123';
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      
      const adminUser = await db.insert(schema.users).values({
        username: 'admin',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        isAdmin: true,
        department: 'IT',
      }).returning();

      console.log('✅ Admin user created successfully!\n');
      console.log('📋 Admin credentials:');
      console.log('   Username: admin');
      console.log('   Password: admin123');
      console.log('   Email: admin@example.com');
      console.log('\n⚠️  Please change the password after first login!');
    }

  } catch (error) {
    console.error('\n❌ Error creating admin user:', error);
    process.exit(1);
  } finally {
    await client.end();
    process.exit(0);
  }
}

createAdmin();


