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
        description: 'Team communication and collaboration platform for real-time messaging and file sharing',
        department: 'IT',
        url: 'https://slack.com',
        iconType: 'message-square',
        status: 'approved',
        approvedDepartments: ['IT', 'Marketing', 'Sales', 'Engineering'],
      },
      {
        name: 'GitHub',
        description: 'Code hosting and version control platform for software development and collaboration',
        department: 'Engineering',
        url: 'https://github.com',
        iconType: 'github',
        status: 'approved',
        approvedDepartments: ['Engineering', 'IT'],
      },
      {
        name: 'Salesforce',
        description: 'Customer relationship management platform for sales pipeline and customer data management',
        department: 'Sales',
        url: 'https://salesforce.com',
        iconType: 'briefcase',
        status: 'approved',
        approvedDepartments: ['Sales', 'Marketing'],
      },
      {
        name: 'Jira',
        description: 'Project management and issue tracking tool for agile development and task management',
        department: 'Engineering',
        url: 'https://jira.atlassian.com',
        iconType: 'trello',
        status: 'approved',
        approvedDepartments: ['Engineering', 'IT', 'Marketing'],
      },
      {
        name: 'Figma',
        description: 'Collaborative design and prototyping tool for UI/UX design and team collaboration',
        department: 'Marketing',
        url: 'https://figma.com',
        iconType: 'layout',
        status: 'approved',
        approvedDepartments: ['Marketing', 'Engineering'],
      },
      {
        name: 'Notion',
        description: 'All-in-one workspace for notes, documentation, wikis, and project management',
        department: 'IT',
        url: 'https://notion.so',
        iconType: 'file-text',
        status: 'approved',
        approvedDepartments: ['IT', 'Marketing', 'Sales', 'Engineering'],
      },
      {
        name: 'HubSpot',
        description: 'Marketing automation platform for inbound marketing, sales, and customer service',
        department: 'Marketing',
        url: 'https://hubspot.com',
        iconType: 'megaphone',
        status: 'pending',
        approvedDepartments: ['Marketing'],
      },
      {
        name: 'Zoom',
        description: 'Video conferencing and online meetings platform for remote collaboration',
        department: 'IT',
        url: 'https://zoom.us',
        iconType: 'video',
        status: 'approved',
        approvedDepartments: ['IT', 'Marketing', 'Sales', 'Engineering'],
      },
      {
        name: 'Microsoft Teams',
        description: 'Collaboration platform with chat, video meetings, and file sharing capabilities',
        department: 'IT',
        url: 'https://teams.microsoft.com',
        iconType: 'users',
        status: 'approved',
        approvedDepartments: ['IT', 'Marketing', 'Sales', 'Engineering'],
      },
      {
        name: 'Confluence',
        description: 'Team workspace for documentation, knowledge sharing, and collaboration',
        department: 'Engineering',
        url: 'https://atlassian.com/software/confluence',
        iconType: 'book',
        status: 'approved',
        approvedDepartments: ['Engineering', 'IT', 'Marketing'],
      },
      {
        name: 'Asana',
        description: 'Project management tool for organizing, tracking, and managing team work',
        department: 'Marketing',
        url: 'https://asana.com',
        iconType: 'check-square',
        status: 'approved',
        approvedDepartments: ['Marketing', 'Sales', 'Engineering'],
      },
      {
        name: 'Trello',
        description: 'Visual collaboration tool for organizing projects with boards, lists, and cards',
        department: 'Marketing',
        url: 'https://trello.com',
        iconType: 'trello',
        status: 'approved',
        approvedDepartments: ['Marketing', 'Sales', 'Engineering'],
      },
      {
        name: 'Google Workspace',
        description: 'Cloud-based productivity suite with Gmail, Drive, Docs, Sheets, and collaboration tools',
        department: 'IT',
        url: 'https://workspace.google.com',
        iconType: 'mail',
        status: 'approved',
        approvedDepartments: ['IT', 'Marketing', 'Sales', 'Engineering'],
      },
      {
        name: 'Microsoft 365',
        description: 'Productivity suite including Office apps, OneDrive, SharePoint, and Teams',
        department: 'IT',
        url: 'https://microsoft.com/microsoft-365',
        iconType: 'file',
        status: 'approved',
        approvedDepartments: ['IT', 'Marketing', 'Sales', 'Engineering'],
      },
      {
        name: 'Monday.com',
        description: 'Work operating system for managing projects, workflows, and team collaboration',
        department: 'Sales',
        url: 'https://monday.com',
        iconType: 'calendar',
        status: 'approved',
        approvedDepartments: ['Sales', 'Marketing', 'Engineering'],
      },
      {
        name: 'Airtable',
        description: 'Cloud-based database platform combining spreadsheet and database functionality',
        department: 'Marketing',
        url: 'https://airtable.com',
        iconType: 'database',
        status: 'approved',
        approvedDepartments: ['Marketing', 'Sales', 'IT'],
      },
      {
        name: 'Tableau',
        description: 'Business intelligence and data visualization platform for analytics and reporting',
        department: 'IT',
        url: 'https://tableau.com',
        iconType: 'bar-chart',
        status: 'approved',
        approvedDepartments: ['IT', 'Marketing', 'Sales'],
      },
      {
        name: 'Power BI',
        description: 'Business analytics service for data visualization and business intelligence',
        department: 'IT',
        url: 'https://powerbi.microsoft.com',
        iconType: 'pie-chart',
        status: 'approved',
        approvedDepartments: ['IT', 'Sales', 'Marketing'],
      },
      {
        name: 'ServiceNow',
        description: 'IT service management platform for workflow automation and service delivery',
        department: 'IT',
        url: 'https://servicenow.com',
        iconType: 'settings',
        status: 'approved',
        approvedDepartments: ['IT'],
      },
      {
        name: 'Zendesk',
        description: 'Customer service platform for support ticket management and customer communication',
        department: 'Sales',
        url: 'https://zendesk.com',
        iconType: 'headphones',
        status: 'approved',
        approvedDepartments: ['Sales', 'Marketing'],
      },
      {
        name: 'Intercom',
        description: 'Customer messaging platform for support, marketing, and sales communication',
        department: 'Sales',
        url: 'https://intercom.com',
        iconType: 'message-circle',
        status: 'approved',
        approvedDepartments: ['Sales', 'Marketing'],
      },
      {
        name: 'Mailchimp',
        description: 'Email marketing platform for campaigns, automation, and audience management',
        department: 'Marketing',
        url: 'https://mailchimp.com',
        iconType: 'send',
        status: 'approved',
        approvedDepartments: ['Marketing'],
      },
      {
        name: 'Adobe Creative Cloud',
        description: 'Suite of creative tools including Photoshop, Illustrator, InDesign, and more',
        department: 'Marketing',
        url: 'https://adobe.com/creativecloud',
        iconType: 'palette',
        status: 'approved',
        approvedDepartments: ['Marketing', 'Engineering'],
      },
      {
        name: 'AWS Console',
        description: 'Amazon Web Services management console for cloud infrastructure and services',
        department: 'Engineering',
        url: 'https://aws.amazon.com/console',
        iconType: 'cloud',
        status: 'approved',
        approvedDepartments: ['Engineering', 'IT'],
      },
      {
        name: 'Azure Portal',
        description: 'Microsoft Azure cloud services management portal for infrastructure and applications',
        department: 'IT',
        url: 'https://portal.azure.com',
        iconType: 'cloud',
        status: 'approved',
        approvedDepartments: ['IT', 'Engineering'],
      },
      {
        name: 'Google Cloud Platform',
        description: 'Cloud computing platform for infrastructure, data analytics, and machine learning',
        department: 'Engineering',
        url: 'https://cloud.google.com',
        iconType: 'cloud',
        status: 'approved',
        approvedDepartments: ['Engineering', 'IT'],
      },
      {
        name: 'Datadog',
        description: 'Monitoring and analytics platform for infrastructure, applications, and logs',
        department: 'Engineering',
        url: 'https://datadoghq.com',
        iconType: 'activity',
        status: 'pending',
        approvedDepartments: ['Engineering', 'IT'],
      },
      {
        name: 'Splunk',
        description: 'Platform for searching, monitoring, and analyzing machine-generated data',
        department: 'IT',
        url: 'https://splunk.com',
        iconType: 'search',
        status: 'approved',
        approvedDepartments: ['IT', 'Engineering'],
      },
      {
        name: 'New Relic',
        description: 'Application performance monitoring and observability platform',
        department: 'Engineering',
        url: 'https://newrelic.com',
        iconType: 'activity',
        status: 'approved',
        approvedDepartments: ['Engineering', 'IT'],
      },
      {
        name: '1Password',
        description: 'Password manager and secure vault for team credential management',
        department: 'IT',
        url: 'https://1password.com',
        iconType: 'lock',
        status: 'approved',
        approvedDepartments: ['IT', 'Marketing', 'Sales', 'Engineering'],
      },
      {
        name: 'LastPass',
        description: 'Password management solution for secure credential storage and sharing',
        department: 'IT',
        url: 'https://lastpass.com',
        iconType: 'key',
        status: 'pending',
        approvedDepartments: ['IT'],
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

