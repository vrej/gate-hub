# Okta Revoked Token Error Fix

## Problem

When visiting the login page, you see this error in the browser console:

```
GET https://munchkin.okta.com/oauth2/v1/userinfo 401 (Unauthorized)
OAuthError: The access token has been revoked.
```

## What's Happening?

You have **old/stale Okta tokens** stored in your browser's localStorage from a previous login session. When you visit the login page:

1. App checks if you're already logged in
2. Finds old Okta tokens in localStorage
3. Tries to validate them with Okta
4. Okta rejects them (tokens have been revoked/expired)
5. Browser's Network tab logs the 401 error
6. App automatically clears the invalid tokens

## Quick Fix

### Option 1: Hard Refresh (Recommended)

1. Press `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
2. This clears cached data and the tokens will be removed
3. 401 error should not appear again

### Option 2: Clear localStorage Manually

1. Open Developer Tools (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Find **Local Storage** → your domain
4. Delete these keys:
   - `okta-token-storage`
   - Any keys starting with `okta-`
5. Refresh the page

### Option 3: Clear Site Data

1. In browser address bar, click the lock icon
2. Click "Cookies" or "Site Settings"
3. Click "Clear data" or "Remove"
4. Refresh the page

### Option 4: Use Incognito Mode

- Open an incognito/private window
- Navigate to your app
- No old tokens will be present

## Is This a Bug?

**No, this is expected behavior when tokens have been revoked.** Common reasons for token revocation:

- ✅ You logged out previously (tokens were revoked)
- ✅ Tokens expired naturally (default: 1 hour)
- ✅ Admin revoked tokens from Okta dashboard
- ✅ Password was changed
- ✅ Okta session was ended

## What We Fixed

### Before Fix:

```
❌ 401 error shown in browser Network tab
❌ Console error: "Get Okta user error: OAuthError: The access token has been revoked"
❌ User needs to manually clear tokens
```

### After Fix:

```
⚠️  401 error shown in browser Network tab (unavoidable - this is the browser)
✅ No console.error messages from our code
✅ Tokens are automatically cleared
✅ User can proceed to login normally
```

## Why Browser Still Shows 401?

The 401 error you see in the **Network tab** is logged by the **browser itself**, not our application code. We cannot prevent this because:

1. Browser logs all HTTP requests/responses
2. This is standard browser behavior
3. It's useful for debugging
4. It doesn't affect functionality

**What matters:** Our application handles the error gracefully and clears the tokens automatically.

## Technical Details

### What Changed in the Code

**File: `client/src/lib/auth.ts`**

1. **Check token expiration BEFORE making API call:**

```typescript
// Check if tokens are expired (before making API call)
const now = Math.floor(Date.now() / 1000);
const isIdTokenExpired = idToken.expiresAt && idToken.expiresAt < now;
const isAccessTokenExpired =
  accessToken.expiresAt && accessToken.expiresAt < now;

if (isIdTokenExpired || isAccessTokenExpired) {
  await oktaAuth.tokenManager.clear();
  return null;
}
```

2. **Better error detection for revoked tokens:**

```typescript
const errorMessage = error.message?.toLowerCase() || "";
const errorName = error.name?.toLowerCase() || "";

const isTokenError =
  errorMessage.includes("revoked") ||
  errorMessage.includes("expired") ||
  errorMessage.includes("invalid_token") ||
  errorMessage.includes("unauthorized") ||
  errorName.includes("oauth");

if (isTokenError) {
  // Clear invalid tokens silently (no console.error)
  await oktaAuth.tokenManager.clear();
  return null;
}
```

3. **Silent handling - no scary error messages:**
   - Revoked token errors are expected and handled gracefully
   - No `console.error()` for token errors
   - Tokens are cleared automatically
   - User can proceed to login

### Auth Check Flow

```
┌─────────────────────────────────────┐
│ User visits login page              │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Check for existing auth             │
│ (getCurrentUserAny)                 │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Found Okta tokens in localStorage?  │
└──────────────┬──────────────────────┘
               │ Yes
               ▼
┌─────────────────────────────────────┐
│ Check token expiration              │
│ (without making API call)           │
└──────────────┬──────────────────────┘
               │
         ┌─────┴─────┐
         │           │
    Expired?    Not Expired
         │           │
         ▼           ▼
    ┌────────┐  ┌──────────────────┐
    │ Clear  │  │ Validate with    │
    │ Tokens │  │ Okta API         │
    └────────┘  └────┬─────────────┘
                     │
                ┌────┴────┐
                │         │
            Valid?    Revoked?
                │         │
                ▼         ▼
         ┌─────────┐  ┌────────┐
         │ Login   │  │ Clear  │
         │ Success │  │ Tokens │
         └─────────┘  └────────┘
                          │
                          ▼
                   ┌──────────────┐
                   │ User can     │
                   │ login fresh  │
                   └──────────────┘
```

## Prevention

### For Users:

- Always use "Logout" button (properly clears tokens)
- Don't leave expired sessions in browser
- Hard refresh if you see old auth errors

### For Developers:

- ✅ Implemented automatic token cleanup
- ✅ Check expiration before making API calls
- ✅ Silent handling of expected errors
- ✅ Clear tokens on any OAuth error

## When to Worry

**Don't worry if you see:**

- ✅ 401 error in Network tab (expected for revoked tokens)
- ✅ "OAuthError" in Network tab (expected)

**Do investigate if you see:**

- ❌ "Unexpected Okta error" in console
- ❌ Infinite loops of 401 errors
- ❌ Tokens not being cleared after error
- ❌ Cannot login after clearing tokens

## Testing

To test the fix:

1. **Simulate revoked tokens:**

   ```javascript
   // In browser console
   localStorage.setItem(
     "okta-token-storage",
     JSON.stringify({
       idToken: { value: "fake-token", expiresAt: 9999999999 },
       accessToken: { value: "fake-token", expiresAt: 9999999999 },
     })
   );
   ```

2. **Refresh page and observe:**
   - ✅ No console.error from our code
   - ✅ Tokens automatically cleared
   - ⚠️ Network tab may show 401 (browser behavior)

3. **Verify tokens cleared:**
   ```javascript
   // In browser console
   localStorage.getItem("okta-token-storage");
   // Should return null
   ```

## Related Files

- `client/src/lib/auth.ts` - Token validation and cleanup
- `client/src/lib/okta-config.ts` - Okta configuration
- `client/src/hooks/use-auth.ts` - Auth state management

## Related Documentation

- `OKTA_401_ERROR_FIX.md` - Regular 401 errors after login
- `OKTA_BROWSER_EXTENSION_FIX.md` - Browser extension issues
- `OKTA_LOGIN_IMPROVEMENTS.md` - Complete improvements summary

---

**Summary:** The 401 error in the browser Network tab is expected when old tokens exist. The application now handles this gracefully by automatically clearing invalid tokens and allowing the user to login fresh.

**Action Required:** If you see the 401 error, do a hard refresh (Ctrl+Shift+R) to clear cached data. The error should not appear again after a fresh login.

**Last Updated:** October 10, 2025

