# Production Login Fix - Session Cookie Issue

## Problem

In production, after successful login, users get a success message but the page doesn't redirect. Console shows:

```
Failed to load resource: the server responded with a status of 401 (Unauthorized)
🔍 apiRequest: GET /api/auth/me
🔍 Final auth header: missing
```

## Root Cause

The session cookie isn't being sent with subsequent requests after login due to cookie domain configuration mismatch.

## Solution

### 1. Update Environment Variables

In your production environment (Digital Ocean, Heroku, etc.), ensure you have:

```bash
# Required
SESSION_SECRET=your-strong-random-secret
NODE_ENV=production

# Optional - Only set if you need cross-subdomain support
# COOKIE_DOMAIN=.whybrands.com
```

**Important:** Do NOT set `COOKIE_DOMAIN` unless you specifically need cross-subdomain session sharing. Leaving it undefined lets the browser automatically handle the cookie domain.

### 2. Cookie Configuration Explained

The session cookie configuration has been updated:

```javascript
cookie: {
  secure: process.env.NODE_ENV === 'production',  // HTTPS only in production
  maxAge: 24 * 60 * 60 * 1000,                    // 24 hours
  domain: process.env.COOKIE_DOMAIN || undefined,  // Auto-detect if not set
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  httpOnly: true                                   // Prevent XSS
}
```

### 3. When to Set COOKIE_DOMAIN

**Set COOKIE_DOMAIN if:**

- Your app runs on multiple subdomains (e.g., `app.whybrands.com` and `admin.whybrands.com`)
- You need shared sessions across subdomains
- Format: `.whybrands.com` (note the leading dot)

**Leave COOKIE_DOMAIN undefined if:**

- Your app runs on a single domain
- You're using a hosting platform with dynamic URLs
- You want automatic cookie domain handling

### 4. Deployment Steps

1. **Update your production environment variables:**

   ```bash
   # On Digital Ocean
   doctl apps update YOUR_APP_ID --env SESSION_SECRET=your-secret

   # Or in your hosting platform's dashboard
   ```

2. **Deploy the updated code:**

   ```bash
   git add .
   git commit -m "Fix: Update session cookie configuration for production"
   git push origin main
   ```

3. **Verify the fix:**
   - Clear browser cookies
   - Log in again
   - Check that `/api/auth/me` returns 200 OK
   - Verify redirect to admin panel works

### 5. Testing in Production

After deploying:

1. Open browser DevTools → Application → Cookies
2. Login to your app
3. Check for `connect.sid` cookie:
   - ✅ Should be present
   - ✅ Domain should match your production domain
   - ✅ Secure flag should be true
   - ✅ HttpOnly should be true
   - ✅ SameSite should be "None"

### 6. Troubleshooting

**Still getting 401 errors?**

1. **Check cookie domain:**

   ```bash
   # In browser console
   document.cookie
   ```

   Look for `connect.sid` cookie

2. **Verify environment variables:**

   ```bash
   # On server
   echo $SESSION_SECRET
   echo $COOKIE_DOMAIN
   echo $NODE_ENV
   ```

3. **Check server logs:**

   ```bash
   # Look for session debug info
   grep "session" /var/log/your-app.log
   ```

4. **Test with curl:**

   ```bash
   # Login and capture cookies
   curl -X POST https://your-app.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"your@email.com","password":"yourpassword"}' \
     -c cookies.txt \
     -v

   # Use cookies in next request
   curl https://your-app.com/api/auth/me \
     -b cookies.txt \
     -v
   ```

### 7. Common Issues

**Issue:** Cookie not being set

- **Cause:** `secure: true` but using HTTP
- **Fix:** Use HTTPS in production or temporarily set `secure: false` for testing

**Issue:** Cookie not sent with requests

- **Cause:** Domain mismatch
- **Fix:** Remove `COOKIE_DOMAIN` environment variable

**Issue:** SameSite blocking

- **Cause:** CORS or cross-domain issues
- **Fix:** Ensure frontend and backend are on same domain or set `sameSite: 'none'` with `secure: true`

### 8. Additional Notes

- Sessions expire after 24 hours
- Each login creates a new session
- Logout properly destroys the session
- Sessions are stored in memory (consider Redis for production scaling)

## Changes Made

1. **server/routes.ts:**
   - Changed `domain: '.whybrands.com'` to `domain: process.env.COOKIE_DOMAIN || undefined`
   - Changed `sameSite: 'lax'` to `sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'`

2. **env.production.example:**
   - Added `COOKIE_DOMAIN` documentation
   - Explained when to use it

## Verification Checklist

- [ ] Environment variables set correctly
- [ ] Code deployed to production
- [ ] Can login successfully
- [ ] No 401 errors after login
- [ ] Redirect to admin panel works
- [ ] Session cookie visible in DevTools
- [ ] Cookie domain matches app domain
- [ ] Secure and HttpOnly flags set correctly
