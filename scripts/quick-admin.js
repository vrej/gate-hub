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

const client = postgres(databaseUrl);
const db = drizzle(client, { schema });

async function quickAdmin() {
  try {
    // Delete existing admin if exists
    await db.delete(schema.users).where(eq(schema.users.username, 'admin'));
    
    // Create admin
    const password = 'admin123';
    const hashed = await bcrypt.hash(password, 10);
    
    const admin = await db.insert(schema.users).values({
      username: 'admin',
      password: hashed,
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      isAdmin: true,
      department: 'IT',
    }).returning();
    
    console.log('\n✅ ADMIN CREATED');
    console.log('Email: admin@example.com');
    console.log('Password: admin123\n');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

quickAdmin();


