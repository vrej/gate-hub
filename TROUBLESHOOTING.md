# Digital Ocean Deployment Troubleshooting Guide

## Common Issues and Solutions

### 1. Build Fails

**Symptoms:**

- Build process fails during deployment
- Error messages in build logs
- Rollup/Vite compatibility issues with Node.js 22

**Solutions:**

- ✅ Ensure all dependencies are in `package.json` (not just devDependencies)
- ✅ Check that `esbuild` is in dependencies (moved from devDependencies)
- ✅ Use Node.js 20.x (specified in package.json engines and .nvmrc)
- ✅ Check for TypeScript compilation errors locally first
- ✅ Avoid Node.js 22 due to Rollup compatibility issues

**Debug Steps:**

```bash
# Test build locally
npm run build

# Check for TypeScript errors
npm run check
```

### 2. App Won't Start

**Symptoms:**

- App deploys but shows "Application Error"
- Runtime logs show startup failures

**Solutions:**

- ✅ Verify all required environment variables are set
- ✅ Check that `DATABASE_URL` is correct and accessible
- ✅ Ensure `SESSION_SECRET` is set
- ✅ Verify `PORT=5001` is set

**Debug Steps:**

```bash
# Check environment variables in Digital Ocean dashboard
# Look at runtime logs for specific error messages
```

### 3. Database Connection Issues

**Symptoms:**

- "Database connection failed" errors
- Timeout errors when connecting to database

**Solutions:**

- ✅ Verify database is accessible from Digital Ocean
- ✅ Check firewall settings on database
- ✅ Ensure connection string format is correct
- ✅ Test database connection locally

**Debug Steps:**

```bash
# Test database connection locally
# Check if DATABASE_URL is correct
# Verify database allows connections from Digital Ocean IPs
```

### 4. Port Configuration Issues

**Symptoms:**

- App shows "Connection refused"
- Port binding errors

**Solutions:**

- ✅ App runs on port 5001 internally
- ✅ Digital Ocean maps this to port 80/443 externally
- ✅ Ensure `PORT=5001` is set in environment variables
- ✅ Check that app listens on `0.0.0.0:5001`

### 5. Environment Variables Not Set

**Symptoms:**

- Features not working (auth, AI, etc.)
- Undefined environment variable errors

**Solutions:**

- ✅ Set all required environment variables in Digital Ocean dashboard
- ✅ Use the `env.example` file as a reference
- ✅ Ensure Vite variables are prefixed with `VITE_`

**Required Variables:**

```
DATABASE_URL=postgresql://...
SESSION_SECRET=your-secret
NODE_ENV=production
PORT=5001
```

### 6. File Upload Issues

**Symptoms:**

- Uploads directory not found
- File uploads failing

**Solutions:**

- ✅ Ensure `uploads` directory is copied in Dockerfile
- ✅ Check file permissions on uploads directory
- ✅ Verify uploads directory exists in production

### 7. Authentication Issues

**Symptoms:**

- Login not working
- Okta integration failing

**Solutions:**

- ✅ Verify Okta configuration is correct
- ✅ Check redirect URIs match your domain
- ✅ Ensure `ENABLE_MANUAL_AUTH=true` if using manual auth
- ✅ Verify Okta environment variables are set

### 8. Static Files Not Serving

**Symptoms:**

- CSS/JS files not loading
- 404 errors for static assets

**Solutions:**

- ✅ Check that Vite build completed successfully
- ✅ Verify static files are in `dist/public` directory
- ✅ Ensure static file serving is configured correctly

## Debugging Commands

### Check Build Locally

```bash
npm run build
```

### Check TypeScript Errors

```bash
npm run check
```

### Test Database Connection

```bash
npm run db:push
```

### Check Environment Variables

Add this to your server code temporarily:

```javascript
console.log("Environment check:", {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  DATABASE_URL: process.env.DATABASE_URL ? "SET" : "NOT SET",
  SESSION_SECRET: process.env.SESSION_SECRET ? "SET" : "NOT SET",
  OKTA_ISSUER: process.env.OKTA_ISSUER ? "SET" : "NOT SET",
});
```

## Digital Ocean Specific Issues

### 1. Node.js Version Issues

- **Issue**: Build fails with "Cannot find module @rollup/rollup-linux-x64-gnu"
- **Cause**: Node.js 22 has compatibility issues with Rollup/Vite
- **Solution**: Use Node.js 20 (specified in package.json engines field)
- **Prevention**: Always specify Node.js version in package.json

### 2. App Platform Limitations

- **Issue**: Some Node.js features might not work
- **Solution**: Use standard Node.js runtime, not edge functions

### 2. Resource Limits

- **Issue**: App runs out of memory/CPU
- **Solution**: Upgrade to larger instance size

### 3. Cold Starts

- **Issue**: App takes time to start after inactivity
- **Solution**: Use health checks and keep-alive

### 4. Log Access

- **Issue**: Can't see application logs
- **Solution**: Use Digital Ocean's log viewer in dashboard

## Getting Help

1. **Check Digital Ocean Documentation**: https://docs.digitalocean.com/products/app-platform/
2. **Review Application Logs**: Use Digital Ocean dashboard
3. **Test Locally First**: Always test builds locally before deploying
4. **Use the Deployment Script**: Run `./deploy.sh` for automated checks
5. **Contact Support**: Use Digital Ocean support if needed

## Prevention Tips

1. **Always test builds locally** before deploying
2. **Use environment variables** for all configuration
3. **Keep dependencies up to date**
4. **Monitor application logs** regularly
5. **Set up health checks** for your application
6. **Use staging environment** for testing deployments
