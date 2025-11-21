# Production Okta Login Fix Guide

## 🚨 Problem Summary

The production application is failing to authenticate users (both Okta SSO and username/password) due to **missing Okta environment variables in the built JavaScript bundle**.

### Error Messages

```
❌ Missing required Okta environment variables: ['VITE_OKTA_CLIENT_ID', 'VITE_OKTA_ISSUER']
🚨 Production mode: Okta SSO is broken due to missing environment variables.
GET https://application-portal.whybrands.com/api/auth/me 401 (Unauthorized)
```

## 🔍 Root Cause

**Vite environment variables must be available at BUILD TIME, not runtime.**

The issue is in the `Dockerfile`. The `VITE_*` environment variables were being set in the `runner` stage (after the build), but Vite needs them during the `builder` stage when it creates the JavaScript bundle.

### How Vite Environment Variables Work

1. During build: Vite reads `import.meta.env.VITE_*` variables
2. Vite **embeds** these values directly into the JavaScript bundle
3. At runtime: The values are already in the code (not read from environment)

This means if the variables aren't set during `npm run build`, they'll be `undefined` in production.

## ✅ Solution Applied

### 1. Fixed Dockerfile

The Dockerfile has been updated to provide environment variables to the `builder` stage:

```dockerfile
# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
RUN apk add --no-cache bash
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Accept build arguments for Vite environment variables (needed at build time)
ARG VITE_OKTA_CLIENT_ID
ARG VITE_OKTA_ISSUER
ARG VITE_OKTA_REDIRECT_URI

# Set Vite environment variables for the build
ENV VITE_OKTA_CLIENT_ID=$VITE_OKTA_CLIENT_ID
ENV VITE_OKTA_ISSUER=$VITE_OKTA_ISSUER
ENV VITE_OKTA_REDIRECT_URI=$VITE_OKTA_REDIRECT_URI

# Build the application
RUN npm run build
```

## 🚀 Deployment Instructions

### Step 1: Verify Environment Variables

Ensure you have the following Okta configuration values:

```bash
VITE_OKTA_CLIENT_ID=your_okta_client_id
VITE_OKTA_ISSUER=https://your-domain.okta.com/oauth2/default
VITE_OKTA_REDIRECT_URI=https://application-portal.whybrands.com/okta-callback
```

> **Note**: You also need backend Okta variables:
>
> ```bash
> OKTA_DOMAIN=your-domain.okta.com
> OKTA_CLIENT_ID=your_okta_client_id
> OKTA_CLIENT_SECRET=your_okta_client_secret
> ```

### Step 2A: Docker Build (Local Testing)

Build the Docker image with build arguments:

```bash
docker build \
  --build-arg VITE_OKTA_CLIENT_ID="your_okta_client_id" \
  --build-arg VITE_OKTA_ISSUER="https://your-domain.okta.com/oauth2/default" \
  --build-arg VITE_OKTA_REDIRECT_URI="https://application-portal.whybrands.com/okta-callback" \
  -t application-portal .
```

Run the container:

```bash
docker run -p 5001:5001 \
  -e DATABASE_URL="your_database_url" \
  -e SESSION_SECRET="your_session_secret" \
  -e JWT_SECRET="your_jwt_secret" \
  -e OKTA_DOMAIN="your-domain.okta.com" \
  -e OKTA_CLIENT_ID="your_okta_client_id" \
  -e OKTA_CLIENT_SECRET="your_okta_client_secret" \
  application-portal
```

### Step 2B: Digital Ocean Deployment

#### Option 1: Using App Spec (app.yaml)

Update your `app.yaml` to include build-time environment variables:

```yaml
name: application-portal
services:
  - name: web
    source_dir: /
    github:
      repo: your-org/ApplicationPortal
      branch: main

    # Build-time environment variables for Vite
    envs:
      - key: VITE_OKTA_CLIENT_ID
        value: "your_okta_client_id"
        type: SECRET
      - key: VITE_OKTA_ISSUER
        value: "https://your-domain.okta.com/oauth2/default"
      - key: VITE_OKTA_REDIRECT_URI
        value: "https://application-portal.whybrands.com/okta-callback"

      # Runtime environment variables
      - key: DATABASE_URL
        value: "${db.DATABASE_URL}"
        type: SECRET
      - key: SESSION_SECRET
        value: "your_session_secret"
        type: SECRET
      - key: JWT_SECRET
        value: "your_jwt_secret"
        type: SECRET
      - key: OKTA_DOMAIN
        value: "your-domain.okta.com"
      - key: OKTA_CLIENT_ID
        value: "your_okta_client_id"
        type: SECRET
      - key: OKTA_CLIENT_SECRET
        value: "your_okta_client_secret"
        type: SECRET
      - key: NODE_ENV
        value: "production"
      - key: PORT
        value: "5001"

    build_command: npm run build
    run_command: npm run start
    http_port: 5001

    health_check:
      http_path: /health
      initial_delay_seconds: 10
      period_seconds: 10
      timeout_seconds: 5
```

Deploy:

```bash
doctl apps update YOUR_APP_ID --spec app.yaml
```

#### Option 2: Using Digital Ocean Dashboard

1. **Go to Digital Ocean → Apps → Your App → Settings**

2. **Click on "Edit" for your service**

3. **Add Environment Variables:**
   - Go to "Environment Variables" section
   - Add the following variables:

   **Build Time Variables** (Critical for Vite):

   ```
   VITE_OKTA_CLIENT_ID=your_okta_client_id
   VITE_OKTA_ISSUER=https://your-domain.okta.com/oauth2/default
   VITE_OKTA_REDIRECT_URI=https://application-portal.whybrands.com/okta-callback
   ```

   **Runtime Variables**:

   ```
   DATABASE_URL=your_database_url
   SESSION_SECRET=your_session_secret
   JWT_SECRET=your_jwt_secret
   OKTA_DOMAIN=your-domain.okta.com
   OKTA_CLIENT_ID=your_okta_client_id
   OKTA_CLIENT_SECRET=your_okta_client_secret
   NODE_ENV=production
   PORT=5001
   ```

4. **Save and Rebuild:**
   - Click "Save"
   - Digital Ocean will automatically trigger a rebuild
   - **Important**: The rebuild will use the new environment variables

#### Option 3: Using Digital Ocean CLI

Set environment variables:

```bash
# Get your app ID
doctl apps list

# Update environment variables
doctl apps update YOUR_APP_ID --spec app.yaml

# Or manually set each variable
doctl apps spec get YOUR_APP_ID > current-spec.yaml
# Edit current-spec.yaml to add the VITE_* variables
doctl apps update YOUR_APP_ID --spec current-spec.yaml
```

### Step 2C: AWS / Other Platforms

If deploying to AWS, Heroku, or other platforms:

**AWS Elastic Beanstalk:**

```bash
# Set environment variables
eb setenv VITE_OKTA_CLIENT_ID="your_okta_client_id" \
  VITE_OKTA_ISSUER="https://your-domain.okta.com/oauth2/default" \
  VITE_OKTA_REDIRECT_URI="https://application-portal.whybrands.com/okta-callback"

# Deploy
eb deploy
```

**Heroku:**

```bash
heroku config:set VITE_OKTA_CLIENT_ID="your_okta_client_id"
heroku config:set VITE_OKTA_ISSUER="https://your-domain.okta.com/oauth2/default"
heroku config:set VITE_OKTA_REDIRECT_URI="https://application-portal.whybrands.com/okta-callback"

git push heroku main
```

## ✅ Verification Steps

### 1. Check Build Logs

After deployment, check the build logs for:

```
🔨 Building application...
✓ built in [time]ms
```

No errors about missing environment variables should appear during build.

### 2. Test the Application

1. **Visit**: `https://application-portal.whybrands.com/login`

2. **Open Browser Console** (F12 → Console tab)

3. **You should NOT see**:

   ```
   ❌ Missing required Okta environment variables
   🚨 Production mode: Okta SSO is broken
   ```

4. **You SHOULD see**:
   - No errors about missing VITE_OKTA variables
   - Okta login button working
   - Username/password login working

### 3. Verify Environment Variables in Bundle

To verify the variables are embedded in the bundle:

```bash
# Download the JavaScript bundle
curl https://application-portal.whybrands.com/assets/index-*.js > bundle.js

# Search for Okta configuration (should find your values)
grep -o "VITE_OKTA" bundle.js
# Should return nothing (variables are replaced with actual values)

# Search for your Okta domain
grep "your-domain.okta.com" bundle.js
# Should find your actual domain embedded in the code
```

### 4. Test Authentication Flow

**Okta SSO:**

1. Click "Sign in with Okta"
2. Should redirect to Okta login page
3. After login, should redirect back and authenticate successfully

**Username/Password:**

1. Enter credentials
2. Should authenticate without 401 errors

## 🔧 Troubleshooting

### Issue: Still seeing "Missing required Okta environment variables"

**Cause**: The app wasn't rebuilt with the new Dockerfile, or environment variables weren't set during build.

**Solution**:

1. Force a full rebuild (not just redeploy)
2. Verify environment variables are set in the platform
3. Check build logs to confirm variables are available

### Issue: 401 Unauthorized after login

**Cause**: Backend Okta variables (OKTA_DOMAIN, OKTA_CLIENT_ID, OKTA_CLIENT_SECRET) are missing or incorrect.

**Solution**:

1. Verify backend Okta variables are set
2. Check server logs for authentication errors
3. Verify Okta client credentials are correct

### Issue: Okta redirect doesn't work

**Cause**: VITE_OKTA_REDIRECT_URI doesn't match Okta application configuration.

**Solution**:

1. Log into Okta Admin Console
2. Go to Applications → Your App → General Settings
3. Verify "Sign-in redirect URIs" includes:
   ```
   https://application-portal.whybrands.com/okta-callback
   ```
4. Update if necessary

### Issue: Different errors in dev vs production

**Cause**: Environment variables work in dev (from .env file) but not in production (from build args).

**Solution**:

1. Dev uses `.env` or `.env.local` files (automatically loaded by Vite)
2. Production uses build arguments (must be passed to Docker/deployment platform)
3. Ensure both are configured correctly

## 📝 Important Notes

### Development vs Production

**Development** (Vite Dev Server):

- Reads from `.env` files automatically
- Variables available at runtime
- Hot reload works with environment changes

**Production** (Built Bundle):

- Variables must be available at BUILD TIME
- Values are embedded in JavaScript bundle
- Cannot be changed without rebuilding

### Security Considerations

1. **Frontend variables are public**: Any value in `VITE_*` will be visible in the browser
2. **Never put secrets in VITE\_ variables**: They will be in the public JavaScript bundle
3. **Backend secrets**: Only set on server (DATABASE_URL, SESSION_SECRET, etc.)

### Required Variables Summary

**Frontend (Build Time - VITE\_)**:

- `VITE_OKTA_CLIENT_ID` - Public Okta client ID
- `VITE_OKTA_ISSUER` - Okta issuer URL
- `VITE_OKTA_REDIRECT_URI` - Callback URL after Okta login

**Backend (Runtime)**:

- `OKTA_DOMAIN` - Okta domain
- `OKTA_CLIENT_ID` - Okta client ID (can be same as frontend)
- `OKTA_CLIENT_SECRET` - Okta client secret (NEVER expose to frontend)
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Express session secret
- `JWT_SECRET` - JWT signing secret

## 🎯 Quick Checklist

Before redeploying:

- [ ] Dockerfile updated with build-time VITE\_ variables
- [ ] All VITE\_\* environment variables set in deployment platform
- [ ] All backend environment variables (OKTA\_\*, DATABASE_URL, etc.) set
- [ ] Okta application configured with correct redirect URI
- [ ] Code committed and pushed to repository
- [ ] Full rebuild triggered (not just restart)
- [ ] Build logs checked for errors
- [ ] Login page tested in browser
- [ ] Browser console checked (no errors)
- [ ] Both Okta and username/password login tested

## 🆘 Getting Help

If you're still experiencing issues after following this guide:

1. **Check Build Logs**: Look for build-time errors
2. **Check Server Logs**: Look for runtime errors
3. **Browser Console**: Look for client-side errors
4. **Network Tab**: Check API request/response details

Collect this information:

- Build logs (full output)
- Server logs (especially auth-related)
- Browser console errors
- Network tab showing failed requests
- Environment variables (without sensitive values)

## 📚 Additional Resources

- [Vite Environment Variables Documentation](https://vitejs.dev/guide/env-and-mode.html)
- [Okta Auth JS SDK Documentation](https://github.com/okta/okta-auth-js)
- [Digital Ocean App Platform Docs](https://docs.digitalocean.com/products/app-platform/)
- [Docker Build Arguments](https://docs.docker.com/engine/reference/builder/#arg)

---

**Last Updated**: October 2025
**Status**: ✅ Fix Applied - Requires Rebuild and Deployment
