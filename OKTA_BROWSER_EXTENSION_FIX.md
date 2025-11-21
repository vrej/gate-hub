# Okta Login - Browser Extension Interference Fix

## Problem

When logging in with Okta, you may see this error in the browser console:

```
web-client-content-script.js:2 Uncaught TypeError: Failed to execute 'observe' on 'MutationObserver': parameter 1 is not of type 'Node'.
```

## Root Cause

This error is **NOT a problem with your application code**. It's caused by browser extensions or security software trying to interact with Okta's authentication iframe.

Common culprits include:

- **Password Managers**: LastPass, 1Password, Dashlane, Bitwarden
- **Ad Blockers**: uBlock Origin, AdBlock Plus
- **Security Extensions**: Privacy Badger, Ghostery
- **Corporate Security Software**: Cisco WebEx, monitoring tools
- **Auto-fill Extensions**: Form fillers, auto-complete tools

## Quick Fixes

### Solution 1: Use Incognito/Private Mode (Fastest)

1. Open a new incognito/private window (Ctrl+Shift+N / Cmd+Shift+N)
2. Navigate to your application
3. Try Okta login again

**Why this works:** Incognito mode disables most browser extensions by default.

### Solution 2: Temporarily Disable Extensions

1. Open your browser's extension manager:
   - **Chrome/Edge**: `chrome://extensions`
   - **Firefox**: `about:addons`
   - **Safari**: Safari → Preferences → Extensions
2. Disable extensions one at a time, especially:
   - Password managers
   - Ad blockers
   - Privacy/security tools
3. Try Okta login after each disable to identify the culprit

### Solution 3: Whitelist Your Domain

If you've identified the problematic extension:

1. Go to the extension's settings
2. Add your application domain to the whitelist/exception list
3. This allows the extension to run but not interfere with authentication

### Solution 4: Use a Different Browser

Try logging in with a different browser that has fewer extensions installed.

## Technical Details

### What's Happening?

When you click "Login with Okta":

1. Your app creates an iframe to Okta's authentication page
2. Browser extensions try to observe DOM changes in this iframe
3. The iframe loads with security restrictions (CORS, CSP)
4. Extensions fail when trying to access iframe content they don't have permission to see

### Why the Error Occurs?

The `MutationObserver` API requires a valid DOM Node as a parameter. Browser extensions often inject content scripts that:

1. Try to observe all iframes on the page
2. Attempt to access iframe content before it's fully loaded
3. Fail when the iframe has cross-origin restrictions

### Application Improvements

The codebase has been updated with:

1. **Better error handling** in `client/src/lib/auth.ts`:
   - Detects MutationObserver errors
   - Provides user-friendly error messages
   - Suggests incognito mode

2. **Improved Okta configuration** in `client/src/lib/okta-config.ts`:
   - Token manager with auto-renewal
   - Better timeout handling
   - Stale token cleanup before login

3. **Token cleanup** before authentication:
   - Clears old tokens to prevent conflicts
   - Reduces interference from stale state

## Testing Your Fix

After applying a solution:

1. **Clear browser cache and cookies**
   - Chrome: Settings → Privacy → Clear browsing data
   - Select "Cookies" and "Cached images"

2. **Restart your browser completely**

3. **Test Okta login**
   - Click "Login with Okta SSO"
   - Check browser console for errors
   - Verify successful redirect to admin page

## Still Having Issues?

### Check Browser Console

Look for additional errors that might provide more context:

```javascript
// Open browser console (F12)
// Before clicking login, enable all log levels
// Click "Login with Okta" and watch for errors
```

### Verify Okta Configuration

Check that environment variables are set correctly:

```bash
# These should be set in your .env file
VITE_OKTA_CLIENT_ID=your_client_id
VITE_OKTA_ISSUER=https://your-domain.okta.com/oauth2/default
VITE_OKTA_REDIRECT_URI=https://your-app.com/okta-callback
```

### Alternative: Use Email/Password Login

As a workaround, you can use the email/password login option below the Okta button until the extension issue is resolved.

## Prevention

### For End Users

- Keep browser extensions minimal
- Only install extensions from trusted sources
- Regularly review and remove unused extensions

### For Developers

- The application now includes better error detection
- User-friendly error messages guide users to solutions
- Consider adding a banner warning about known extension conflicts

## Related Files

- `client/src/lib/okta-config.ts` - Okta configuration
- `client/src/lib/auth.ts` - Authentication logic with error handling
- `client/src/pages/login.tsx` - Login page
- `client/src/pages/okta-callback.tsx` - Callback handler

## References

- [Okta Auth JS SDK Documentation](https://github.com/okta/okta-auth-js)
- [MutationObserver API](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver)
- [Browser Extension Conflicts with OAuth](https://developer.okta.com/docs/guides/sign-into-web-app-redirect/node-express/main/#troubleshooting)

---

**Last Updated:** October 10, 2025

