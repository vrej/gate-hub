# Production Debug Logs Guide

## 🔍 What We Added

Added comprehensive console logging to the login page to help diagnose Okta configuration issues in production.

## 📋 What You'll See in Console

When you visit the login page in production, you'll see detailed logging output.

---

## ✅ What WORKING Configuration Looks Like

If everything is correctly configured, you'll see:

```
=== 🔍 OKTA CONFIGURATION DEBUG (Login Page) ===
Environment: production
Production: true

📋 Environment Variables:
  VITE_OKTA_CLIENT_ID: 0oa242e1rq8mZvw5c0h8
  VITE_OKTA_ISSUER: https://munchkin.okta.com/oauth2/default
  VITE_OKTA_REDIRECT_URI: https://application-portal.whybrands.com/login/callback

⚙️ Okta Config Object:
  clientId: 0oa242e1rq8mZvw5c0h8
  issuer: https://munchkin.okta.com/oauth2/default
  redirectUri: https://application-portal.whybrands.com/login/callback
  scopes: ["openid", "profile", "email", "groups"]
  pkce: true

🔐 Okta Auth Instance:
  Available: ✅ YES
  Config: {clientId: "0oa242e1rq8mZvw5c0h8", issuer: "https://munchkin.okta.com/oauth2/default", ...}

✅ Okta configuration is COMPLETE - Login should work
=== END OKTA DEBUG ===
```

**When you click "Login with Okta":**

```
🔵 Okta Login Button Clicked
  Client ID: 0oa242e1rq8mZvw5c0h8
  Issuer: https://munchkin.okta.com/oauth2/default
  Redirect URI: https://application-portal.whybrands.com/login/callback
  Okta Auth available: true
  Calling loginWithOkta()...
  Redirecting to Okta...
```

---

## ❌ What BROKEN Configuration Looks Like

If environment variables are missing (current production issue):

```
=== 🔍 OKTA CONFIGURATION DEBUG (Login Page) ===
Environment: production
Production: true

📋 Environment Variables:
  VITE_OKTA_CLIENT_ID: ❌ MISSING
  VITE_OKTA_ISSUER: ❌ MISSING
  VITE_OKTA_REDIRECT_URI: ❌ MISSING

⚙️ Okta Config Object:
  clientId: ❌ MISSING
  issuer: ❌ MISSING
  redirectUri: https://application-portal.whybrands.com/login/callback

🔐 Okta Auth Instance:
  Available: ❌ NO

❌ Okta configuration is INCOMPLETE - Login will fail
Missing:
  - VITE_OKTA_CLIENT_ID
  - VITE_OKTA_ISSUER
  - oktaAuth instance not created
=== END OKTA DEBUG ===
```

**When you click "Login with Okta":**

```
🔵 Okta Login Button Clicked
  Client ID: ❌ MISSING
  Issuer: ❌ MISSING
  Redirect URI: ❌ MISSING
  Okta Auth available: false
  Calling loginWithOkta()...
❌ Okta Login Error: Error: Okta is not configured. Please check your environment variables.
  Error message: Okta is not configured. Please check your environment variables.
```

---

## 🎯 How to Check in Production

### Step 1: Visit the Login Page

```
https://application-portal.whybrands.com/login
```

### Step 2: Open Browser Console

- **Chrome/Edge**: Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
- **Firefox**: Press `F12` or `Ctrl+Shift+K` (Windows) / `Cmd+Option+K` (Mac)
- **Safari**: Press `Cmd+Option+C` (Mac)

Click on the **"Console"** tab.

### Step 3: Look for the Debug Output

Scroll to find the section starting with:

```
=== 🔍 OKTA CONFIGURATION DEBUG (Login Page) ===
```

### Step 4: Verify the Values

**Check these specific lines:**

1. **Client ID:**

   ```
   VITE_OKTA_CLIENT_ID: 0oa242e1rq8mZvw5c0h8
   ```

   - ✅ Should show: `0oa242e1rq8mZvw5c0h8`
   - ❌ If shows: `❌ MISSING` → Variables not embedded

2. **Issuer:**

   ```
   VITE_OKTA_ISSUER: https://munchkin.okta.com/oauth2/default
   ```

   - ✅ Should show: `https://munchkin.okta.com/oauth2/default`
   - ❌ If shows: `❌ MISSING` → Variables not embedded

3. **Redirect URI:**

   ```
   VITE_OKTA_REDIRECT_URI: https://application-portal.whybrands.com/login/callback
   ```

   - ✅ Should show: `https://application-portal.whybrands.com/login/callback`
   - ❌ If shows: `❌ MISSING` → Variables not embedded

4. **Okta Auth Instance:**

   ```
   Available: ✅ YES
   ```

   - ✅ Should show: `✅ YES`
   - ❌ If shows: `❌ NO` → oktaAuth not initialized

5. **Summary:**
   ```
   ✅ Okta configuration is COMPLETE - Login should work
   ```

   - ✅ Should show: This message
   - ❌ If shows: `❌ Okta configuration is INCOMPLETE` → Need to redeploy

### Step 5: Test Login (Optional)

Click the "Login with Okta" button and check console for:

```
🔵 Okta Login Button Clicked
```

This will show the current values again when you attempt login.

---

## 🔧 Interpreting Results

### Scenario 1: All Values Present ✅

**Console shows:**

- Client ID: `0oa242e1rq8mZvw5c0h8`
- Issuer: `https://munchkin.okta.com/oauth2/default`
- Redirect URI: `https://application-portal.whybrands.com/login/callback`
- Okta Auth: `✅ YES`
- Status: `✅ COMPLETE`

**Meaning:** Environment variables were properly embedded during build. Login should work!

**If login still fails:** Check backend variables or Okta configuration.

### Scenario 2: All Values Missing ❌

**Console shows:**

- Client ID: `❌ MISSING`
- Issuer: `❌ MISSING`
- Redirect URI: `❌ MISSING`
- Okta Auth: `❌ NO`
- Status: `❌ INCOMPLETE`

**Meaning:** Environment variables were NOT available during build. This is the current production issue.

**Solution:** Redeploy with proper environment variables (see AWS_DEPLOYMENT_FIX.md)

### Scenario 3: Redirect URI Only ⚠️

**Console shows:**

- Client ID: `❌ MISSING`
- Issuer: `❌ MISSING`
- Redirect URI: `https://application-portal.whybrands.com/login/callback` ✅
- Okta Auth: `❌ NO`

**Meaning:** Redirect URI has a fallback (uses `window.location.origin`), but required variables are missing.

**Solution:** Redeploy with VITE_OKTA_CLIENT_ID and VITE_OKTA_ISSUER.

### Scenario 4: Partial Values ⚠️

**Console shows:**

- Some values present, others missing

**Meaning:** Build process had some but not all environment variables.

**Solution:** Verify all three VITE*OKTA*\* variables are set, then redeploy.

---

## 📸 Taking Screenshots

If you need to share the console output:

1. **Take a screenshot** of the console showing the debug output
2. Make sure it includes:
   - The header: `=== 🔍 OKTA CONFIGURATION DEBUG ===`
   - All three environment variable lines
   - The Okta Auth availability
   - The final status (✅ COMPLETE or ❌ INCOMPLETE)

---

## 🚀 Next Steps Based on Results

### If Console Shows "✅ COMPLETE"

1. ✅ Environment variables are embedded correctly
2. Try logging in with Okta
3. If login still fails:
   - Check backend environment variables (OKTA_DOMAIN, OKTA_CLIENT_SECRET)
   - Check Okta application configuration
   - Check server logs

### If Console Shows "❌ INCOMPLETE"

1. ❌ Environment variables are NOT embedded
2. **This confirms the issue**
3. Follow deployment instructions:
   - See: `AWS_DEPLOYMENT_FIX.md` for AWS-specific steps
   - See: `QUICK_FIX_REFERENCE.md` for quick commands
4. After redeploying, refresh page and check console again

---

## 🧪 Testing After Fix

After you redeploy with proper environment variables:

1. **Clear browser cache** (important!)
   - Chrome: `Ctrl+Shift+Delete` / `Cmd+Shift+Delete`
   - OR do a hard refresh: `Ctrl+Shift+R` / `Cmd+Shift+R`

2. **Visit login page again**

   ```
   https://application-portal.whybrands.com/login
   ```

3. **Open console and check**
   - Should now show actual values instead of `❌ MISSING`
   - Should show `✅ COMPLETE` status

4. **Test login**
   - Click "Login with Okta"
   - Should redirect to Okta login page
   - After login, should redirect back and authenticate

---

## 🔄 Comparing Before and After

**BEFORE (Current Production - Broken):**

```
VITE_OKTA_CLIENT_ID: ❌ MISSING
VITE_OKTA_ISSUER: ❌ MISSING
❌ Okta configuration is INCOMPLETE - Login will fail
```

**AFTER (Fixed Production - Working):**

```
VITE_OKTA_CLIENT_ID: 0oa242e1rq8mZvw5c0h8
VITE_OKTA_ISSUER: https://munchkin.okta.com/oauth2/default
✅ Okta configuration is COMPLETE - Login should work
```

---

## 💡 Why This Helps

1. **Confirms the problem:** Shows if env vars are missing
2. **Verifies the fix:** After redeploy, shows actual values
3. **Debugging:** Helps identify partial or incorrect configurations
4. **Documentation:** Provides clear evidence of current state

---

## 🗑️ Removing Debug Logs (Later)

Once everything is working, you can remove or disable these debug logs:

**Option 1: Remove completely**

```tsx
// Delete the useEffect block in login.tsx
```

**Option 2: Only log in development**

```tsx
useEffect(() => {
  if (import.meta.env.DEV) {
    // ... existing debug logs ...
  }
}, []);
```

**Option 3: Keep for future debugging**
Leave them in - they don't harm performance and might be useful later.

---

## 📞 What to Share When Asking for Help

If you need help, share:

1. **Screenshot of console** showing the debug output
2. **Which deployment method** you're using (Elastic Beanstalk, ECS, EC2, etc.)
3. **Whether you've redeployed** since the fix was committed
4. **Any error messages** from the console or server logs

---

**Last Updated:** October 10, 2025  
**Status:** Debug logs added - Ready to test in production  
**Next Step:** Deploy to production and check console output
