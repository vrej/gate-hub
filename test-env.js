#!/usr/bin/env node

import "dotenv/config";
import { Pool } from "pg";
import fetch from "node-fetch";

// Colors for console output
const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  reset: "\x1b[0m",
  bold: "\x1b[1m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log(`\n${colors.bold}${colors.blue}=== ${title} ===${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, "green");
}

function logError(message) {
  log(`❌ ${message}`, "red");
}

function logWarning(message) {
  log(`⚠️  ${message}`, "yellow");
}

function logInfo(message) {
  log(`ℹ️  ${message}`, "blue");
}

// Test database connection
async function testDatabase() {
  logSection("DATABASE CONNECTION TEST");

  if (!process.env.DATABASE_URL) {
    logError("DATABASE_URL is not set");
    return false;
  }

  logInfo(
    `Testing connection to: ${process.env.DATABASE_URL.replace(/\/\/.*@/, "//***:***@")}`
  );

  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    // Test basic connection
    const client = await pool.connect();
    logSuccess("Database connection established");

    // Test query execution
    const result = await client.query(
      "SELECT NOW() as current_time, version() as db_version"
    );
    logSuccess(
      `Database query successful - Current time: ${result.rows[0].current_time}`
    );
    logInfo(`Database version: ${result.rows[0].db_version.split(" ")[0]}`);

    // Test schema tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    if (tablesResult.rows.length > 0) {
      logSuccess(`Found ${tablesResult.rows.length} tables in database`);
      tablesResult.rows.forEach((row) => {
        logInfo(`  - ${row.table_name}`);
      });
    } else {
      logWarning("No tables found in database (schema may not be initialized)");
    }

    client.release();
    await pool.end();
    return true;
  } catch (error) {
    logError(`Database connection failed: ${error.message}`);
    return false;
  }
}

// Test OpenAI API
async function testOpenAI() {
  logSection("OPENAI API TEST");

  if (!process.env.OPENAI_API_KEY) {
    logWarning("OPENAI_API_KEY is not set (optional)");
    return true;
  }

  logInfo("Testing OpenAI API connection...");

  try {
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      logSuccess(
        `OpenAI API connection successful - Available models: ${data.data.length}`
      );
      return true;
    } else {
      logError(
        `OpenAI API test failed: ${response.status} ${response.statusText}`
      );
      return false;
    }
  } catch (error) {
    logError(`OpenAI API connection failed: ${error.message}`);
    return false;
  }
}

// Test Jira API
async function testJira() {
  logSection("JIRA API TEST");

  if (
    !process.env.JIRA_BASE_URL ||
    !process.env.JIRA_API_TOKEN ||
    !process.env.JIRA_ADMIN_EMAIL
  ) {
    logWarning("JIRA credentials not fully configured (optional)");
    return true;
  }

  logInfo(`Testing Jira API connection to: ${process.env.JIRA_BASE_URL}`);

  try {
    const credentials = Buffer.from(
      `${process.env.JIRA_ADMIN_EMAIL}:${process.env.JIRA_API_TOKEN}`
    ).toString("base64");

    const response = await fetch(
      `${process.env.JIRA_BASE_URL}/rest/api/3/myself`,
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          Accept: "application/json",
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      logSuccess(
        `Jira API connection successful - Logged in as: ${data.displayName}`
      );
      return true;
    } else {
      logError(
        `Jira API test failed: ${response.status} ${response.statusText}`
      );
      return false;
    }
  } catch (error) {
    logError(`Jira API connection failed: ${error.message}`);
    return false;
  }
}

// Test Okta configuration
async function testOkta() {
  logSection("OKTA CONFIGURATION TEST");

  if (
    !process.env.OKTA_ISSUER ||
    !process.env.OKTA_CLIENT_ID ||
    !process.env.OKTA_CLIENT_SECRET
  ) {
    logWarning("OKTA credentials not fully configured (optional)");
    return true;
  }

  logInfo(`Testing Okta configuration: ${process.env.OKTA_ISSUER}`);

  try {
    const response = await fetch(
      `${process.env.OKTA_ISSUER}/.well-known/openid_configuration`
    );

    if (response.ok) {
      const data = await response.json();
      logSuccess("Okta OpenID configuration retrieved successfully");
      logInfo(`Issuer: ${data.issuer}`);
      logInfo(`Authorization endpoint: ${data.authorization_endpoint}`);
      return true;
    } else {
      logError(
        `Okta configuration test failed: ${response.status} ${response.statusText}`
      );
      return false;
    }
  } catch (error) {
    logError(`Okta configuration test failed: ${error.message}`);
    return false;
  }
}

// Test environment variables
function testEnvironmentVariables() {
  logSection("ENVIRONMENT VARIABLES TEST");

  const requiredVars = {
    DATABASE_URL: "Database connection string",
    SESSION_SECRET: "Session encryption key",
  };

  const optionalVars = {
    NODE_ENV: "Node environment",
    ENABLE_MANUAL_AUTH: "Manual authentication flag",
    OPENAI_API_KEY: "OpenAI API key",
    JIRA_BASE_URL: "Jira base URL",
    JIRA_API_TOKEN: "Jira API token",
    JIRA_ADMIN_EMAIL: "Jira admin email",
    OKTA_ISSUER: "Okta issuer URL",
    OKTA_CLIENT_ID: "Okta client ID",
    OKTA_CLIENT_SECRET: "Okta client secret",
  };

  let allRequiredSet = true;

  // Check required variables
  for (const [varName, description] of Object.entries(requiredVars)) {
    if (process.env[varName]) {
      logSuccess(`${varName}: Set (${description})`);
    } else {
      logError(`${varName}: Not set (${description})`);
      allRequiredSet = false;
    }
  }

  // Check optional variables
  for (const [varName, description] of Object.entries(optionalVars)) {
    if (process.env[varName]) {
      logSuccess(`${varName}: Set (${description})`);
    } else {
      logWarning(`${varName}: Not set (${description})`);
    }
  }

  return allRequiredSet;
}

// Main test function
async function runAllTests() {
  log(
    `${colors.bold}${colors.blue}🔍 ENVIRONMENT AND API CONNECTION TEST${colors.reset}`
  );
  log(`Testing all configured services and connections...\n`);

  const results = {
    envVars: testEnvironmentVariables(),
    database: await testDatabase(),
    openai: await testOpenAI(),
    jira: await testJira(),
    okta: await testOkta(),
  };

  // Summary
  logSection("TEST SUMMARY");

  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;

  log(`${colors.bold}Tests passed: ${passed}/${total}${colors.reset}`);

  if (results.envVars && results.database) {
    logSuccess("✅ Core functionality is ready!");
    logInfo("You can now run: npm run dev");
  } else {
    logError("❌ Core functionality is not ready");
    if (!results.envVars) {
      logError("Required environment variables are missing");
    }
    if (!results.database) {
      logError("Database connection failed");
    }
  }

  // Optional services status
  if (results.openai) logSuccess("OpenAI API: Ready");
  if (results.jira) logSuccess("Jira API: Ready");
  if (results.okta) logSuccess("Okta SSO: Ready");

  return results;
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export { runAllTests };
