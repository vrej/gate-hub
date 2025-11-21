# Production Deployment Checklist

## 🚀 Deploy the Okta Login Fix

Use this checklist to ensure your production deployment includes all necessary fixes.

---

## Pre-Deployment

### ✅ Code Changes

- [x] Dockerfile updated with build-time VITE\_\* variables
- [x] app.yaml updated with VITE\_\* environment variables
- [x] Helper scripts created (rebuild-with-env.sh, test-production-build.sh)
- [x] Documentation created

### ✅ Environment Variables Prepared

Gather these values before deployment:

**Frontend (Build Time)**:

- [ ] `VITE_OKTA_CLIENT_ID` = ************\_\_\_************
- [ ] `VITE_OKTA_ISSUER` = ************\_\_\_************
- [ ] `VITE_OKTA_REDIRECT_URI` = ************\_\_\_************

**Backend (Runtime)**:

- [ ] `DATABASE_URL` = ************\_\_\_************
- [ ] `SESSION_SECRET` = ************\_\_\_************
- [ ] `JWT_SECRET` = ************\_\_\_************
- [ ] `OKTA_DOMAIN` = ************\_\_\_************
- [ ] `OKTA_CLIENT_ID` = ************\_\_\_************
- [ ] `OKTA_CLIENT_SECRET` = ************\_\_\_************

---

## Deployment Steps

### Step 1: Commit Changes

```bash
git add Dockerfile app.yaml README.md
git commit -m "Fix: Add Okta environment variables to build stage"
git push origin main
```

- [ ] Changes committed
- [ ] Changes pushed to repository

### Step 2: Update Environment Variables in Digital Ocean

**Option A: Dashboard** (Recommended)

1. [ ] Go to https://cloud.digitalocean.com/apps
2. [ ] Select "whybrands-application-portal"
3. [ ] Click "Settings" → Edit service
4. [ ] Add/Update environment variables:
   - [ ] `VITE_OKTA_CLIENT_ID`
   - [ ] `VITE_OKTA_ISSUER`
   - [ ] `VITE_OKTA_REDIRECT_URI`
   - [ ] All backend variables (if not already set)
5. [ ] Click "Save"

**Option B: CLI**

```bash
# Get your app ID
doctl apps list

# Update app with new spec
doctl apps update <APP_ID> --spec app.yaml
```

- [ ] App updated via CLI

### Step 3: Trigger Rebuild

- [ ] Auto-deploy triggered (from git push)
- [ ] OR manually triggered rebuild in dashboard

### Step 4: Monitor Build

- [ ] Build started successfully
- [ ] Build completed without errors
- [ ] Check build logs for warnings

**Build should take**: 5-10 minutes

---

## Post-Deployment Verification

### Step 5: Initial Checks

- [ ] App is running (check Digital Ocean status)
- [ ] No deployment errors in Digital Ocean dashboard
- [ ] Health check endpoint responding: `https://application-portal.whybrands.com/health`

### Step 6: Browser Console Verification

1. [ ] Visit: `https://application-portal.whybrands.com/login`
2. [ ] Open browser console (F12 → Console)
3. [ ] Verify NO errors about missing VITE_OKTA variables
4. [ ] Should NOT see: `❌ Missing required Okta environment variables`
5. [ ] Should NOT see: `🚨 Production mode: Okta SSO is broken`

### Step 7: Test Okta SSO Login

- [ ] Click "Sign in with Okta" button
- [ ] Redirects to Okta login page
- [ ] Login with Okta credentials
- [ ] Redirects back to application
- [ ] Successfully authenticated
- [ ] No 401 errors in console

### Step 8: Test Username/Password Login

- [ ] Enter username/password credentials
- [ ] Click "Sign in" button
- [ ] Successfully authenticated
- [ ] No 401 errors in console
- [ ] Redirected to applications page

### Step 9: Test Application Functionality

- [ ] Applications page loads correctly
- [ ] Can view application details
- [ ] Can create new application (admin)
- [ ] Can edit application (admin)
- [ ] Can submit access request (user)
- [ ] All features working as expected

### Step 10: Verify Bundle Embedding (Advanced)

**Optional**: Verify environment variables are embedded in bundle:

```bash
# Download the bundle
curl https://application-portal.whybrands.com/assets/index-*.js > bundle.js

# Should find your Okta domain
grep "your-domain.okta.com" bundle.js
# Should return matches

# Should NOT find unreplaced variables
grep "import.meta.env.VITE_OKTA" bundle.js
# Should return nothing
```

- [ ] Environment variables embedded in bundle
- [ ] No unreplaced import.meta.env references

---

## Rollback Plan (If Needed)

If deployment fails or issues occur:

### Quick Rollback

1. [ ] In Digital Ocean: Actions → Rollback to previous deployment
2. [ ] Test previous version is working
3. [ ] Investigate issue

### Alternative: Force Rebuild

1. [ ] Verify environment variables are correctly set
2. [ ] Force rebuild: Digital Ocean → Actions → Force Rebuild
3. [ ] Monitor build logs for errors

---

## Common Issues & Solutions

### Issue: Still seeing "Missing required Okta environment variables"

**Solution**:

1. [ ] Verify variables are set in Digital Ocean dashboard
2. [ ] Check variables have correct names (VITE_OKTA_CLIENT_ID, not OKTA_CLIENT_ID)
3. [ ] Force a clean rebuild
4. [ ] Clear browser cache and hard refresh

### Issue: Okta redirect fails

**Solution**:

1. [ ] Check VITE_OKTA_REDIRECT_URI matches Okta app configuration
2. [ ] Login to Okta Admin Console
3. [ ] Verify redirect URI is in application settings
4. [ ] Update if necessary

### Issue: 401 Unauthorized after login

**Solution**:

1. [ ] Check backend environment variables are set (OKTA_DOMAIN, etc.)
2. [ ] Check server logs for authentication errors
3. [ ] Verify Okta client secret is correct

### Issue: Different behavior in dev vs production

**Solution**:

- Dev uses `.env` files (automatic)
- Production uses build arguments (must be set)

1. [ ] Ensure production variables match dev variables
2. [ ] Rebuild with correct variables

---

## Success Criteria

All of the following must be true:

- [x] Code changes committed and pushed
- [ ] Environment variables set in deployment platform
- [ ] Build completed successfully
- [ ] Application is running
- [ ] No console errors about missing Okta variables
- [ ] Okta SSO login works
- [ ] Username/password login works
- [ ] Application features working correctly
- [ ] No 401 unauthorized errors

---

## Documentation Reference

- **Quick Start**: [`QUICK_FIX_REFERENCE.md`](QUICK_FIX_REFERENCE.md)
- **Complete Guide**: [`OKTA_PRODUCTION_FIX_SUMMARY.md`](OKTA_PRODUCTION_FIX_SUMMARY.md)
- **Detailed Troubleshooting**: [`PRODUCTION_OKTA_FIX.md`](PRODUCTION_OKTA_FIX.md)
- **General Deployment**: [`DIGITAL_OCEAN_DEPLOYMENT.md`](DIGITAL_OCEAN_DEPLOYMENT.md)

---

## Completion

**Deployment Date**: ********\_\_\_********

**Deployed By**: ********\_\_\_********

**Deployment Status**:

- [ ] ✅ Success - All tests passed
- [ ] ⚠️ Partial - Some issues, but working
- [ ] ❌ Failed - Rolled back

**Notes**:

```
_________________________________________________________

_________________________________________________________

_________________________________________________________
```

---

**Remember**: If you encounter any issues, refer to the troubleshooting documentation or roll back to the previous version while investigating.
