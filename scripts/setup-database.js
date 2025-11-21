
const { Client } = require('pg');

async function setupDatabase() {
  console.log('=== SETTING UP DATABASE TABLES ===');
  
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable not found!');
    console.log('Please set up PostgreSQL database first.');
    return;
  }

  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();
    console.log('✓ Connected to PostgreSQL database');

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        is_admin BOOLEAN DEFAULT false NOT NULL,
        email TEXT NOT NULL UNIQUE,
        department TEXT
      );
    `);
    console.log('✓ Users table created');

    // Create applications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS applications (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        department TEXT NOT NULL,
        url TEXT,
        icon_type TEXT DEFAULT 'default',
        status TEXT DEFAULT 'approved' NOT NULL,
        approved_departments TEXT[]
      );
    `);
    console.log('✓ Applications table created');

    // Create requests table
    await client.query(`
      CREATE TABLE IF NOT EXISTS requests (
        id SERIAL PRIMARY KEY,
        application_name TEXT NOT NULL,
        department TEXT NOT NULL,
        justification TEXT NOT NULL,
        application_url TEXT,
        status TEXT DEFAULT 'pending' NOT NULL,
        requested_by INTEGER NOT NULL,
        requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);
    console.log('✓ Requests table created');

    // Create activity_logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        details TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);
    console.log('✓ Activity logs table created');

    // Insert sample admin user
    await client.query(`
      INSERT INTO users (username, password, first_name, last_name, is_admin, email, department)
      VALUES ('admin', '$2b$10$rOHiD.XZGNLKmgPfFQKweeW7bF8kN1Kj1bX9PfFQKweAB1Kj1bX9P', 'Admin', 'User', true, 'admin@company.com', 'IT')
      ON CONFLICT (username) DO NOTHING;
    `);
    console.log('✓ Sample admin user created (username: admin, password: admin)');

    console.log('\n=== DATABASE SETUP COMPLETED ===');
    console.log('You can now use the application with PostgreSQL!');

  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    await client.end();
  }
}

setupDatabase()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
