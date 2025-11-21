# Okta SSO Setup Guide

This guide explains how to configure Okta Single Sign-On (SSO) authentication for the admin panel.

## ⚠️ **CRITICAL: Authorization Server Configuration**

**Important Feedback from Okta Support**: Use the **org authorization server** instead of the custom authorization server.

### Org Authorization Server vs Custom Authorization Server

- **✅ Recommended**: Org Authorization Server (`https://your-company.okta.com`)
- **❌ Not Recommended**: Custom Authorization Server (`https://your-company.okta.com/oauth2/default`)

### Why Use Org Authorization Server?

1. **Simpler Configuration**: No need for `/oauth2/default` suffix
2. **Built-in Features**: Includes basic OIDC functionality out of the box
3. **Less Complexity**: Fewer configuration options to manage
4. **Better Compatibility**: Works seamlessly with most OIDC implementations

### Configuration Impact

**Org Authorization Server**:
```env
VITE_OKTA_ISSUER=https://your-company.okta.com
```

**Custom Authorization Server** (not recommended):
```env
VITE_OKTA_ISSUER=https://your-company.okta.com/oauth2/default
```

### Limitations of Org Authorization Server

According to [Okta documentation](https://developer.okta.com/docs/concepts/auth-servers/), the org authorization server has some limitations compared to custom authorization servers:

- **Limited Customization**: Fewer configuration options
- **Basic Scopes**: Limited to standard OIDC scopes
- **No Custom Claims**: Cannot define custom claims
- **Standard Policies**: Uses default Okta policies

For most applications, these limitations are acceptable and the org authorization server provides sufficient functionality.

## Prerequisites

- An Okta account with admin privileges
- Access to create applications in your Okta organization

## Okta Configuration

### Step 1: Create a New Application in Okta

1. Log into your Okta admin console
2. Navigate to **Applications** → **Applications**
3. Click **Create App Integration**
4. Choose **OIDC - OpenID Connect**
5. Select **Single-Page Application**
6. Configure the application:
   - **App integration name**: Application Portal
   - **Sign-in redirect URIs**:
     - `http://localhost:5001/login/callback` (for development)
     - `https://your-domain.com/login/callback` (for production)
   - **Sign-out redirect URIs**:
     - `http://localhost:5001/login` (for development)
     - `https://your-domain.com/login` (for production)
   - **Controlled access**: Choose appropriate assignment option

### Step 2: Set up Groups (Optional but Recommended)

1. Navigate to **Directory** → **Groups**
2. Create a group for admin users (e.g., "ApplicationPortal-Admins")
3. Add users who should have admin access to this group

### Step 3: Configure Application Assignment

1. Go to your created application
2. Navigate to **Assignments** tab
3. Assign the application to users or groups who should have access

## Environment Variables

Create a `.env` file in your project root with the following variables:

```env
# Okta Configuration (Using Org Authorization Server)
VITE_OKTA_CLIENT_ID=your-okta-client-id
VITE_OKTA_ISSUER=https://your-company.okta.com
VITE_OKTA_REDIRECT_URI=http://localhost:5001/login/callback

# For production, use your actual domain
# VITE_OKTA_REDIRECT_URI=https://your-domain.com/login/callback
```

**Note**: In Vite, environment variables are accessed using `import.meta.env` instead of `process.env`. Make sure your environment variables are prefixed with `VITE_` to be available in the client-side code.

### Finding Your Okta Values

- **Client ID**: Found in your Okta application's **General** tab
- **Issuer**: Your Okta domain (e.g., `https://dev-123456.okta.com`) - **NO `/oauth2/default` suffix**
- **Redirect URI**: The callback URL where Okta will redirect after authentication

### Verification

You can verify your org authorization server configuration by accessing:
```
https://your-company.okta.com/.well-known/openid-configuration
```

This should return a JSON configuration object with your OIDC settings.

## Admin Access Configuration

The application supports **dual authentication methods** for admin access:

### 1. Okta SSO (Recommended)

- **Primary Method**: Okta Single Sign-On with group-based permissions
- **Groups**: Users in specific groups (configured in `client/src/lib/okta-config.ts`)
  - Default groups: `['Administrators', 'Admin', 'admin', 'ApplicationPortal-Admins', 'Portal-Admins', 'IT-Admins']`
  - You can modify these groups in the `ADMIN_GROUPS` constant

### 2. Manual Login (Fallback)

- **Fallback Method**: Traditional email/password authentication
- **Use Cases**: When Okta SSO is unavailable or for emergency access
- **Requirements**: User account must have `isAdmin: true` in the database

### Admin Access Flow

1. **Preferred**: Users are encouraged to use Okta SSO for enhanced security
2. **Fallback**: If Okta is unavailable, users can use "Manual Admin Login" option
3. **Flexible**: Both methods provide full admin access to the dashboard

### Configuration Options

- **Okta Required**: Set `requiresOktaForAdmin()` to `true` in `useAuth` hook
- **Okta Optional**: Set `requiresOktaForAdmin()` to `false` (current default)
- **Group Matching**: Customize `ADMIN_GROUPS` array in `okta-config.ts`
- **Email Fallback**: Add specific admin emails to `isAdminByEmail` function

## Testing the Setup

### Testing Okta SSO

1. Start your development server: `npm run dev`
2. Navigate to `/login`
3. Click "Login with Okta SSO"
4. You should be redirected to Okta for authentication
5. After successful authentication, you'll be redirected back to `/admin`

### Testing Manual Login Fallback

1. Navigate to `/admin` directly
2. You'll see the admin authentication screen with two options:
   - **"Login with Okta SSO"** (recommended)
   - **"Manual Admin Login"** (fallback)
3. Click "Manual Admin Login" to open the fallback login modal
4. Enter credentials for an account with `isAdmin: true`
5. You should gain access to the admin dashboard

### Testing Regular User Login

1. Navigate to `/login`
2. Use the regular email/password form
3. If the account has admin privileges, you'll be redirected to `/admin`
4. If not, you'll be redirected to the main applications page

## Troubleshooting

### Common Issues

1. **CORS Errors**: Make sure your redirect URIs are correctly configured in Okta
2. **Authentication Fails**: Check that your client ID and issuer are correct
3. **Not Redirecting**: Verify the redirect URI matches exactly between Okta and your environment variables
4. **Admin Access Denied**: Ensure the user is in the correct Okta groups

### Authorization Server Issues

#### Issue: "401 Unauthorized" when accessing OIDC configuration

**Symptoms**: `GET https://your-company.okta.com/.well-known/openid-configuration 401 (Unauthorized)`

**Solutions**:
1. **Verify you're using org authorization server**: Remove `/oauth2/default` from issuer URL
2. **Check application status**: Ensure app is "ACTIVE" in Okta admin console
3. **Verify application type**: Must be "OIDC - OpenID Connect" + "Single-Page Application"
4. **Check application assignment**: Ensure app is assigned to users who need access

#### Issue: "Invalid issuer" error

**Symptoms**: JWT verification fails with "Invalid issuer" error

**Solutions**:
1. **Use org authorization server**: Set issuer to `https://your-company.okta.com`
2. **Remove `/oauth2/default`**: This suffix is only for custom authorization servers
3. **Verify domain**: Ensure Okta domain is correct and accessible

### Debug Mode

To enable debug mode, you can modify the Okta configuration in `client/src/lib/okta-config.ts`:

```typescript
export const oktaConfig = {
  // ... other config
  devMode: process.env.NODE_ENV === "development",
};
```

## Security Considerations

1. **HTTPS**: Always use HTTPS in production
2. **Group Management**: Regularly review and update admin group memberships
3. **Token Storage**: Tokens are stored securely in the browser's memory
4. **Session Management**: Implement proper session timeouts

## Additional Features

### Password Reset Functionality

The application now includes a password reset feature for regular email/password authentication:

- **"Forgot Password?" link** on the login page
- **Email-based reset flow** with secure tokens
- **Password reset page** at `/reset-password?token=xyz`
- **Complete user flow** from request to password update

This feature works alongside Okta SSO and provides an additional recovery option for users with regular accounts.

See `PASSWORD_RESET_GUIDE.md` for detailed implementation and configuration information.

## Support

For issues specific to Okta configuration, consult the [Okta Developer Documentation](https://developer.okta.com/docs/).

For password reset functionality, see the `PASSWORD_RESET_GUIDE.md` documentation.

For application-specific issues, check the browser console for error messages and ensure all environment variables are properly set.

### Okta Support Resources

- **OIDC Configuration**: https://your-company.okta.com/.well-known/openid-configuration
- **Authorization Server Concepts**: https://developer.okta.com/docs/concepts/auth-servers/
- **Okta Developer Documentation**: https://developer.okta.com/docs/
