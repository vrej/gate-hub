# Jira Reporter Field Troubleshooting Guide

## Issue Description

When users submit access requests through the Application Portal, Jira tickets are created with the admin user as the reporter instead of the actual user who submitted the request.

## Root Causes

The issue can be caused by several factors:

### 1. User Not Found in Jira

- The user's email address doesn't exist in Jira
- The user exists but is inactive
- The user's email address format doesn't match exactly

### 2. Reporter Field Not Available

- The project or issue type doesn't support the reporter field
- The reporter field is disabled for the specific project/issue type
- The admin user doesn't have permission to set other users as reporters

### 3. Jira Configuration Issues

- API permissions are insufficient
- Project configuration doesn't allow reporter changes
- Issue type workflow doesn't support reporter field

## Diagnostic Steps

### Step 1: Check User Existence

Use the diagnostic endpoint to check if a user exists in Jira:

```bash
curl -X POST http://localhost:3000/api/jira/check-user \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"email": "user@company.com"}'
```

### Step 2: Run Test Script

Use the test script to diagnose the issue:

```bash
node test-jira-reporter.js user@company.com
```

### Step 3: Check Server Logs

Look for these log messages in your server logs:

- `🔍 Searching for Jira user with email: user@company.com`
- `✅ Found Jira user for reporter: user@company.com`
- `❌ Jira user not found for email: user@company.com`
- `📋 Reporter field available: true/false`
- `⚠️ Reporter field error detected: [error message]`

## Solutions

### Solution 1: Create User in Jira

If the user doesn't exist in Jira:

1. Add the user to Jira manually
2. Ensure the email address matches exactly
3. Make sure the user is active

### Solution 2: Enable Reporter Field

If the reporter field is not available:

1. Go to Jira Project Settings
2. Navigate to Issue Types
3. Edit the issue type being used
4. Enable the Reporter field
5. Save changes

### Solution 3: Check Admin Permissions

If the admin user can't set reporters:

1. Verify the admin user has appropriate permissions
2. Check if the admin user can assign issues to other users
3. Ensure the admin user has "Browse Projects" and "Create Issues" permissions

### Solution 4: Update Jira Configuration

If project configuration is the issue:

1. Go to Project Settings > Workflows
2. Check if the workflow allows reporter changes
3. Modify workflow if necessary
4. Update issue type scheme if needed

## Testing the Fix

After implementing any of the above solutions:

1. Run the test script again: `node test-jira-reporter.js user@company.com`
2. Submit a new access request through the portal
3. Check the Jira ticket to verify the reporter is correct
4. Review server logs for success messages

## Expected Log Output

When working correctly, you should see:

```
🔍 Searching for Jira user with email: user@company.com
Found 1 users in Jira search results
✅ Found Jira user for reporter: user@company.com (John Doe) - Account ID: 123456
📋 Reporter field available: true
✅ Jira ticket created successfully with reporter John Doe (user@company.com): PROJ-123
```

## Common Error Messages

- `User not found. Found 0 users in search results.` - User doesn't exist in Jira
- `Reporter field is not available for Task in project PROJ` - Reporter field disabled
- `Failed to search for Jira user` - API permission issues
- `Reporter field error detected: [specific error]` - Configuration issue

## Environment Variables

Ensure these environment variables are set correctly:

```bash
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_API_TOKEN=your-api-token
JIRA_ADMIN_EMAIL=admin@company.com
```

## Support

If you continue to experience issues:

1. Check the server logs for detailed error messages
2. Verify Jira API credentials and permissions
3. Test with the diagnostic endpoints
4. Contact your Jira administrator for configuration assistance
