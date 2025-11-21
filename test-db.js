#!/usr/bin/env node

import "dotenv/config";
import { Pool } from "pg";

console.log("🔍 Testing Database Connection...\n");

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set in your .env file");
  console.log("\nPlease create a .env file with:");
  console.log("DATABASE_URL=your_database_connection_string");
  process.exit(1);
}

console.log(
  `📡 Connecting to: ${process.env.DATABASE_URL.replace(/\/\/.*@/, "//***:***@")}`
);

async function testConnection() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    // Test connection
    const client = await pool.connect();
    console.log("✅ Database connection successful!");

    // Test basic query
    const result = await client.query("SELECT NOW() as current_time");
    console.log(`⏰ Database time: ${result.rows[0].current_time}`);

    // Test schema
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    if (tablesResult.rows.length > 0) {
      console.log(`📋 Found ${tablesResult.rows.length} tables:`);
      tablesResult.rows.forEach((row) => {
        console.log(`   - ${row.table_name}`);
      });
    } else {
      console.log("⚠️  No tables found - you may need to run: npm run db:push");
    }

    client.release();
    await pool.end();

    console.log("\n🎉 Database test completed successfully!");
    console.log("You can now run: npm run dev");
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);

    if (error.message.includes("WebSocket")) {
      console.log("\n💡 WebSocket connection issues? Try:");
      console.log("1. Check your DATABASE_URL format");
      console.log("2. For Neon: Make sure to include ?sslmode=require");
      console.log("3. For local PostgreSQL: Make sure PostgreSQL is running");
    }

    process.exit(1);
  }
}

testConnection();
