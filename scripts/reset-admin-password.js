import 'dotenv/config';
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema";
import bcrypt from "bcrypt";
import { eq, or } from "drizzle-orm";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

// Create postgres connection
const client = postgres(databaseUrl);
const db = drizzle(client, { schema });

console.log('🔐 Resetting admin password...\n');

async function resetAdminPassword() {
  try {
    console.log('Connecting to database...');
    
    // First, get all users to see what we have
    const allUsers = await db.select().from(schema.users);
    console.log(`Found ${allUsers.length} total user(s) in database`);
    
    // Find admin user by username
    let adminUser = allUsers.find(u => u.username === 'admin');
    
    // If not found by username, try to find any admin user
    if (!adminUser) {
      adminUser = allUsers.find(u => u.isAdmin === true);
    }

    if (!adminUser) {
      console.log('\n❌ No admin user found. Creating one...\n');
      
      // Create admin user
      const defaultPassword = 'admin123';
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      
      const newAdmin = await db.insert(schema.users).values({
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
      adminUser = newAdmin[0];
    } else {
      // Reset password for existing admin
      console.log(`\nFound existing admin user: ${adminUser.username} (${adminUser.email})`);
      console.log('Resetting password...\n');
      
      const newPassword = 'admin123';
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      const updated = await db.update(schema.users)
        .set({ 
          password: hashedPassword,
          isAdmin: true  // Ensure admin status
        })
        .where(eq(schema.users.id, adminUser.id))
        .returning();

      console.log('✅ Admin password reset successfully!\n');
      console.log('📋 Admin credentials:');
      console.log('   Username: ' + updated[0].username);
      console.log('   Password: admin123');
      console.log('   Email: ' + updated[0].email);
      console.log('   Admin status: ✅ Yes');
      adminUser = updated[0];
    }

    console.log('\n💡 You can login with:');
    console.log('   - Username: ' + adminUser.username);
    console.log('   - OR Email: ' + adminUser.email);
    console.log('   - Password: admin123');
    console.log('\n⚠️  Please change the password after first login!');

  } catch (error) {
    console.error('\n❌ Error resetting admin password:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    process.exit(1);
  } finally {
    await client.end();
    process.exit(0);
  }
}

resetAdminPassword();


