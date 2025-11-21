import 'dotenv/config';
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema";
import bcrypt from "bcrypt";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

// Create postgres connection
const client = postgres(databaseUrl);
const db = drizzle(client, { schema });

console.log('🌱 Seeding database with dummy data...\n');

async function seedDatabase() {
  try {
    // Check if data already exists
    const existingUsers = await db.select().from(schema.users);
    if (existingUsers.length > 0) {
      console.log('⚠️  Database already has data. Clear it first? (y/n)');
      console.log(`   Found ${existingUsers.length} user(s)`);
      console.log('   Proceeding with seeding anyway...\n');
    }

    // 1. Create Users
    console.log('👥 Creating users...');
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const users = await db.insert(schema.users).values([
      {
        username: 'admin',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@dwmgatehub.com',
        isAdmin: true,
        department: 'IT',
      },
      {
        username: 'john.doe',
        password: hashedPassword,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@dwmgatehub.com',
        isAdmin: false,
        department: 'Marketing',
      },
      {
        username: 'jane.smith',
        password: hashedPassword,
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@dwmgatehub.com',
        isAdmin: false,
        department: 'Sales',
      },
      {
        username: 'bob.wilson',
        password: hashedPassword,
        firstName: 'Bob',
        lastName: 'Wilson',
        email: 'bob.wilson@dwmgatehub.com',
        isAdmin: false,
        department: 'Engineering',
      },
    ]).returning();
    
    console.log(`✅ Created ${users.length} users`);

    // 2. Create Applications
    console.log('\n📱 Creating applications...');
    const applications = await db.insert(schema.applications).values([
      {
        name: 'Slack',
        description: 'Team communication and collaboration platform',
        department: 'IT',
        url: 'https://slack.com',
        iconType: 'message-square',
        status: 'approved',
        approvedDepartments: ['IT', 'Marketing', 'Sales', 'Engineering'],
      },
      {
        name: 'GitHub',
        description: 'Code hosting and version control',
        department: 'Engineering',
        url: 'https://github.com',
        iconType: 'github',
        status: 'approved',
        approvedDepartments: ['Engineering', 'IT'],
      },
      {
        name: 'Salesforce',
        description: 'Customer relationship management platform',
        department: 'Sales',
        url: 'https://salesforce.com',
        iconType: 'briefcase',
        status: 'approved',
        approvedDepartments: ['Sales', 'Marketing'],
      },
      {
        name: 'Jira',
        description: 'Project management and issue tracking',
        department: 'Engineering',
        url: 'https://jira.atlassian.com',
        iconType: 'trello',
        status: 'approved',
        approvedDepartments: ['Engineering', 'IT', 'Marketing'],
      },
      {
        name: 'Figma',
        description: 'Collaborative design and prototyping tool',
        department: 'Marketing',
        url: 'https://figma.com',
        iconType: 'layout',
        status: 'approved',
        approvedDepartments: ['Marketing', 'Engineering'],
      },
      {
        name: 'Notion',
        description: 'All-in-one workspace for notes and docs',
        department: 'IT',
        url: 'https://notion.so',
        iconType: 'file-text',
        status: 'approved',
        approvedDepartments: ['IT', 'Marketing', 'Sales', 'Engineering'],
      },
      {
        name: 'HubSpot',
        description: 'Marketing automation platform',
        department: 'Marketing',
        url: 'https://hubspot.com',
        iconType: 'megaphone',
        status: 'pending',
        approvedDepartments: ['Marketing'],
      },
      {
        name: 'Zoom',
        description: 'Video conferencing and online meetings',
        department: 'IT',
        url: 'https://zoom.us',
        iconType: 'video',
        status: 'approved',
        approvedDepartments: ['IT', 'Marketing', 'Sales', 'Engineering'],
      },
    ]).returning();
    
    console.log(`✅ Created ${applications.length} applications`);

    // 3. Create Access Requests
    console.log('\n📝 Creating access requests...');
    const requests = await db.insert(schema.requests).values([
      {
        applicationName: 'Salesforce',
        department: 'Marketing',
        justification: 'Need access to manage marketing campaigns and track leads',
        applicationUrl: 'https://salesforce.com',
        status: 'pending',
        requestedBy: users[1].id, // John Doe
      },
      {
        applicationName: 'GitHub',
        department: 'IT',
        justification: 'Required for managing infrastructure code and DevOps scripts',
        applicationUrl: 'https://github.com',
        status: 'approved',
        requestedBy: users[0].id, // Admin
      },
      {
        applicationName: 'Figma',
        department: 'Sales',
        justification: 'Need to create presentation materials and sales collateral',
        applicationUrl: 'https://figma.com',
        status: 'pending',
        requestedBy: users[2].id, // Jane Smith
      },
      {
        applicationName: 'Jira',
        department: 'Marketing',
        justification: 'Want to track marketing campaign tasks and collaborate with engineering',
        applicationUrl: 'https://jira.atlassian.com',
        status: 'approved',
        requestedBy: users[1].id, // John Doe
      },
      {
        applicationName: 'DataDog',
        department: 'Engineering',
        justification: 'Need monitoring and observability tools for production systems',
        applicationUrl: 'https://datadoghq.com',
        status: 'rejected',
        requestedBy: users[3].id, // Bob Wilson
      },
    ]).returning();
    
    console.log(`✅ Created ${requests.length} access requests`);

    // 4. Create Activity Logs
    console.log('\n📊 Creating activity logs...');
    const activityLogs = await db.insert(schema.activityLogs).values([
      {
        userId: users[0].id,
        action: 'User Login',
        details: 'Admin user logged in successfully',
      },
      {
        userId: users[1].id,
        action: 'Request Created',
        details: 'Created access request for Salesforce',
      },
      {
        userId: users[0].id,
        action: 'Request Approved',
        details: 'Approved GitHub access request',
      },
      {
        userId: users[2].id,
        action: 'Request Created',
        details: 'Created access request for Figma',
      },
      {
        userId: users[0].id,
        action: 'Application Created',
        details: 'Added new application: HubSpot',
      },
    ]).returning();
    
    console.log(`✅ Created ${activityLogs.length} activity logs`);

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('✅ Database seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   👥 Users: ${users.length}`);
    console.log(`   📱 Applications: ${applications.length}`);
    console.log(`   📝 Requests: ${requests.length}`);
    console.log(`   📊 Activity Logs: ${activityLogs.length}`);
    console.log('\n💡 Default credentials:');
    console.log('   Username: admin');
    console.log('   Password: password123');
    console.log('\n   Or any other user with password: password123');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('\n❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await client.end();
    process.exit(0);
  }
}

seedDatabase();

