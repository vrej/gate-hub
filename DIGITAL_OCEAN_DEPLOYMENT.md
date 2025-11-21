# Complete Digital Ocean Deployment Guide

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [Critical Configuration](#critical-configuration)
4. [Environment Setup](#environment-setup)
5. [Build Process](#build-process)
6. [Deployment Steps](#deployment-steps)
7. [Post-Deployment](#post-deployment)
8. [Troubleshooting](#troubleshooting)
9. [Monitoring & Maintenance](#monitoring--maintenance)
10. [Best Practices](#best-practices)

---

## 🚀 Quick Start

### Before You Begin

- [ ] Digital Ocean account with App Platform access
- [ ] PostgreSQL database (Digital Ocean Managed or external)
- [ ] Domain name (optional but recommended)
- [ ] Environment variables prepared
- [ ] Application tested locally

### 5-Minute Deployment Checklist

1. **Configure Environment Variables** → All required variables set
2. **Update app.yaml** → Port 8080, health checks, build commands
3. **Test Production Build** → Local testing with `npm run build`
4. **Deploy to Digital Ocean** → Using CLI or dashboard
5. **Verify Deployment** → Health checks, functionality, logs

---

## 📋 Prerequisites

### Required Accounts & Services

- **Digital Ocean Account**: With App Platform access
- **PostgreSQL Database**: Digital Ocean Managed Database or external (AWS RDS, Neon, etc.)
- **Domain Name**: For custom domain (optional)
- **GitHub Repository**: Code repository connected to Digital Ocean

### Technical Requirements

- **Node.js 20**: Required for compatibility (not Node.js 22)
- **PostgreSQL**: For data storage
- **HTTPS**: Automatically provided by Digital Ocean
- **Modern Browser**: For application functionality

---

## ⚠️ Critical Configuration

### 1. Port Configuration

**⚠️ CRITICAL**: Digital Ocean expects applications to run on port **8080**, not 5001.

```javascript
// server/index.ts
const port = process.env.PORT ? parseInt(process.env.PORT) : 8080;
```

**Configuration**:

```yaml
# .do/app.yaml
http_port: 8080
envs:
  - key: PORT
    value: "8080"
```

### 2. Health Check Endpoint

**Required**: Digital Ocean requires a health check endpoint for monitoring.

```javascript
// Add to your Express app
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});
```

**Configuration**:

```yaml
# .do/app.yaml
health_check:
  http_path: /health
  initial_delay_seconds: 10
  period_seconds: 10
  timeout_seconds: 5
  success_threshold: 1
  failure_threshold: 3
```

### 3. Production vs Development Separation

**Critical**: Separate development and production servers to avoid Vite/Rollup issues.

- **`server/index.ts`** - Production server (NO Vite imports)
- **`server/dev-server.ts`** - Development server (with Vite)

### 4. Dependency Management

**Critical**: Proper dependency placement prevents module not found errors.

```json
{
  "dependencies": {
    "ws": "^8.16.0",
    "express": "^4.18.0"
    // Runtime dependencies only
  },
  "devDependencies": {
    "vite": "^5.4.0",
    "typescript": "^5.0.0"
    // Development dependencies only
  }
}
```

---

## 🔧 Environment Setup

### Required Environment Variables

Create a `.env.production` file:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database

# Security
SESSION_SECRET=your-super-secret-session-key-here
JWT_SECRET=your-super-secret-jwt-key-here

# Application Settings
NODE_ENV=production
PORT=8080
NODE_VERSION=20

# Okta Configuration (if using SSO)
OKTA_DOMAIN=your-domain.okta.com
OKTA_CLIENT_ID=your-client-id
OKTA_CLIENT_SECRET=your-client-secret

# Frontend Okta Variables
VITE_OKTA_CLIENT_ID=your-client-id
VITE_OKTA_ISSUER=https://your-domain.okta.com
VITE_OKTA_REDIRECT_URI=https://your-app-domain.com/okta-callback

# External Services (optional)
OPENAI_API_KEY=your-openai-api-key
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=noreply@yourcompany.com

# Jira Integration (optional)
JIRA_URL=https://your-domain.atlassian.net
JIRA_ADMIN_EMAIL=admin@yourcompany.com
JIRA_API_TOKEN=your-jira-api-token
```

### Digital Ocean Configuration File

Create `.do/app.yaml`:

```yaml
name: your-app-name
services:
  - name: web
    source_dir: /
    github:
      repo: your-username/your-repo
      branch: main
    build_command: npm run build
    run_command: npm start
    environment_slug: node-js
    instance_count: 1
    instance_size_slug: basic-xxs
    http_port: 8080
    health_check:
      http_path: /health
      initial_delay_seconds: 10
      period_seconds: 10
      timeout_seconds: 5
      success_threshold: 1
      failure_threshold: 3
    routes:
      - path: /
    envs:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: "8080"
      - key: NODE_VERSION
        value: "20"
      # Add all other environment variables here
      - key: DATABASE_URL
        value: "your-database-url"
      - key: SESSION_SECRET
        value: "your-session-secret"
      # ... other variables
```

### Buildpack Configuration

Create `buildpack.toml`:

```toml
[[buildpacks]]
  id = "digitalocean/nodejs-appdetect"
  version = "v0.0.6"

[[buildpacks]]
  id = "heroku/nodejs"
  version = "v0.296.5"
```

### NPM Configuration

Create `.npmrc`:

```bash
production=false
```

---

## 🔨 Build Process

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "NODE_ENV=development tsx server/dev-server.ts",
    "start": "NODE_ENV=production node dist/index.js",
    "build": "npm run build:client && npm run build:server",
    "build:client": "vite build",
    "build:server": "esbuild server/index.ts --platform=node --bundle --format=esm --outdir=dist --target=node20 --packages=external --external:bufferutil --external:utf-8-validate",
    "fix:digitalocean": "bash fix-digital-ocean.sh"
  },
  "engines": {
    "node": "20.x"
  }
}
```

### Production Server Structure

```typescript
// server/index.ts - Production only
import express from "express";
import { registerRoutes } from "./routes";

const app = express();

// Production static serving (no Vite)
const serveStatic = (app: express.Express) => {
  app.use(express.static("dist/public"));
  app.get("*", (req, res) => {
    if (!req.path.startsWith("/api")) {
      res.sendFile("dist/public/index.html", { root: process.cwd() });
    }
  });
};

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// Use PORT environment variable
const port = process.env.PORT ? parseInt(process.env.PORT) : 8080;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
```

### Development Server Structure

```typescript
// server/dev-server.ts - Development only
import express from "express";
import { createServer as createViteServer } from "vite";
import { registerRoutes } from "./routes";

const app = express();

// Development with Vite
const vite = await createViteServer({
  server: { middlewareMode: true },
  appType: "custom",
});

app.use(vite.middlewares);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

const port = process.env.PORT ? parseInt(process.env.PORT) : 5001;
app.listen(port, () => {
  console.log(`Dev server running on port ${port}`);
});
```

---

## 🚀 Deployment Steps

### Step 1: Prepare Your Application

```bash
# Copy environment file
cp env.production.example .env.production

# Edit with your actual values
nano .env.production

# Test production build locally
npm run build
NODE_ENV=production PORT=8080 node dist/index.js
```

### Step 2: Test Production Build

```bash
# Test health endpoint
curl http://localhost:8080/health

# Test API endpoints
curl http://localhost:8080/api/applications

# Test frontend
curl http://localhost:8080/
```

### Step 3: Deploy to Digital Ocean

**Option A: Using Digital Ocean CLI**

```bash
# Install Digital Ocean CLI
brew install doctl  # macOS
# or download from https://github.com/digitalocean/doctl/releases

# Authenticate
doctl auth init

# Deploy
doctl apps create --spec .do/app.yaml
```

**Option B: Using Digital Ocean Dashboard**

1. **Log into Digital Ocean**
2. **Navigate to**: Apps → Create App
3. **Connect Repository**: Choose GitHub and select your repo
4. **Configure App**:
   - **Source Directory**: `/` (root)
   - **Build Command**: `npm run build`
   - **Run Command**: `npm start`
   - **HTTP Port**: `8080`
5. **Add Environment Variables**: Copy from your `.env.production`
6. **Deploy**: Click "Create Resources"

### Step 4: Configure Domain (Optional)

1. **In Digital Ocean Dashboard**: Apps → Your App → Settings → Domains
2. **Add Custom Domain**: Enter your domain name
3. **Configure DNS**: Follow Digital Ocean's DNS instructions
4. **SSL Certificate**: Automatically provided by Digital Ocean

---

## ✅ Post-Deployment

### Step 1: Verify Deployment

1. **Check Health Endpoint**: `https://your-app.ondigitalocean.app/health`
2. **Test Application**: Visit your app URL
3. **Check Logs**: Digital Ocean Dashboard → Apps → Your App → Logs

### Step 2: Database Migration

The application will automatically run migrations on startup, but you can also run them manually:

```bash
npm run db:push
```

### Step 3: Create Initial Admin User

Create your first admin user through the application interface or by inserting directly into the database.

### Step 4: Test All Features

- [ ] User registration and login
- [ ] Application management
- [ ] Department and category management
- [ ] Access requests
- [ ] File uploads
- [ ] CSV imports
- [ ] Okta SSO (if configured)

---

## 🔍 Troubleshooting

### Common Issues & Solutions

#### Issue 1: Module Not Found Error

**Symptoms**: `Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'ws'`

**Solutions**:

1. **Move `ws` to dependencies**: Ensure `ws` is in `dependencies`, not `devDependencies`
2. **Check package.json**: Verify all runtime dependencies are in `dependencies`
3. **Regenerate lock file**: `rm package-lock.json && npm install`

#### Issue 2: Build Failure (vite not found)

**Symptoms**: `sh: 1: vite: not found`

**Solutions**:

1. **Remove postinstall scripts**: Don't run build during dependency installation
2. **Check devDependencies**: Ensure `vite` is in `devDependencies`
3. **Update .npmrc**: Set `production=false`

#### Issue 3: Runtime Rollup Error

**Symptoms**: `Error: Cannot find module @rollup/rollup-linux-x64-gnu`

**Solutions**:

1. **Separate dev/prod servers**: Use different server files for dev and prod
2. **Remove Vite from production**: Don't import Vite in production server
3. **Exclude Rollup dependencies**: Use `--external` flags in esbuild

#### Issue 4: Health Check Failures

**Symptoms**: `Readiness probe failed: dial tcp: connect: connection refused`

**Solutions**:

1. **Use port 8080**: Set `PORT=8080` and `http_port: 8080`
2. **Implement health endpoint**: Add `/health` endpoint
3. **Check health configuration**: Verify health check settings in app.yaml

#### Issue 5: Lock File Sync Issues

**Symptoms**: `npm ci` fails with missing dependencies

**Solutions**:

1. **Remove conflicting dependencies**: Avoid optional dependencies that cause conflicts
2. **Regenerate lock file**: `rm package-lock.json && npm install`
3. **Check version conflicts**: Ensure no conflicting version requirements

#### Issue 6: Database Connection Issues

**Symptoms**: Database connection fails in production

**Solutions**:

1. **Verify DATABASE_URL**: Check format and credentials
2. **Check database accessibility**: Ensure database allows connections from Digital Ocean
3. **Test connection locally**: Test with production environment variables

### Debug Steps

1. **Check Build Logs**: Digital Ocean Dashboard → Apps → Your App → Build Logs
2. **Check Runtime Logs**: Digital Ocean Dashboard → Apps → Your App → Runtime Logs
3. **Test Locally**: `npm run build && NODE_ENV=production PORT=8080 node dist/index.js`
4. **Verify Environment Variables**: Check all variables are set correctly
5. **Check Health Endpoint**: `curl https://your-app.ondigitalocean.app/health`

### Emergency Fixes

If deployment fails, run the fix script:

```bash
npm run fix:digitalocean
```

This script will:

- Fix dependency issues
- Update build configuration
- Verify port configuration
- Test production build

---

## 📊 Monitoring & Maintenance

### Health Monitoring

- **Health Endpoint**: Monitor `/health` response times
- **Set up Alerts**: Configure alerts for health check failures
- **Monitor Logs**: Watch application logs for errors

### Performance Optimization

- **Bundle Size**: Keep bundles under 500KB
- **Code Splitting**: Use code splitting for large applications
- **Database Queries**: Optimize database queries
- **Caching**: Implement proper caching strategies

### Scaling

- **Horizontal Scaling**: Increase instance count
- **Vertical Scaling**: Increase instance size
- **Auto-scaling**: Configure based on CPU/memory usage

### Backups

- **Database Backups**: Handled by Digital Ocean (if using managed database)
- **Application Data**: Stored in database
- **Uploaded Files**: Stored in `uploads/` directory

### Updates and Maintenance

1. **Regular Updates**: Keep dependencies updated
2. **Security Patches**: Apply security updates promptly
3. **Backup Strategy**: Regular database backups
4. **Testing**: Test updates in staging environment first

---

## 🎯 Best Practices

### Development Workflow

1. **Separate Environments**: Use different configurations for dev and prod
2. **Test Production Build**: Always test production build locally
3. **Environment Variables**: Use environment variables for configuration
4. **Proper Logging**: Implement comprehensive logging and error handling

### Dependency Management

1. **Keep Dependencies Updated**: Regular updates for security and features
2. **Use Exact Versions**: For critical dependencies
3. **Avoid Conflicts**: Don't add conflicting optional dependencies
4. **Security Audits**: Regular dependency security audits

### Configuration Management

1. **Environment Variables**: Use environment variables for all configuration
2. **Documentation**: Document all required environment variables
3. **Validation**: Implement proper validation for configuration
4. **Secrets Management**: Never commit secrets to version control

### Security

1. **HTTPS**: Always use HTTPS in production
2. **Strong Secrets**: Use strong session and JWT secrets
3. **Input Validation**: Validate and sanitize all inputs
4. **Rate Limiting**: Implement rate limiting for API endpoints
5. **Authentication**: Proper authentication and authorization

### Cost Optimization

1. **Start Small**: Begin with basic instance size
2. **Monitor Usage**: Track resource usage
3. **Scale Appropriately**: Scale based on actual needs
4. **Database Size**: Choose appropriate database size
5. **CDN**: Consider using Digital Ocean Spaces for file storage

---

## 📞 Support & Resources

### Digital Ocean Resources

- **Documentation**: https://docs.digitalocean.com/products/app-platform/
- **CLI Tool**: https://github.com/digitalocean/doctl
- **Community**: https://www.digitalocean.com/community/
- **Support**: https://www.digitalocean.com/support/

### Application Monitoring

- **Health Check**: `https://your-app.ondigitalocean.app/health`
- **Build Logs**: Digital Ocean Dashboard → Apps → Your App → Build Logs
- **Runtime Logs**: Digital Ocean Dashboard → Apps → Your App → Runtime Logs

### Emergency Contacts

- **Digital Ocean Support**: Available through dashboard
- **Application Issues**: Check logs and health endpoint
- **Database Issues**: Contact database provider support

---

## ✅ Final Checklist

### Pre-Deployment

- [ ] All environment variables configured
- [ ] Production build tested locally
- [ ] Health endpoint implemented
- [ ] Port configuration set to 8080
- [ ] Dependencies properly organized
- [ ] Build process verified

### Post-Deployment

- [ ] Application starts successfully
- [ ] Health checks pass
- [ ] All endpoints respond correctly
- [ ] Database connections work
- [ ] File uploads function
- [ ] Authentication works
- [ ] All features operational

### Monitoring

- [ ] Health monitoring configured
- [ ] Logs being collected
- [ ] Alerts set up
- [ ] Performance metrics tracked
- [ ] Backup strategy implemented

---

## 🎯 Summary

This comprehensive guide covers:

1. **Complete Setup**: From environment preparation to deployment
2. **Critical Configuration**: Port, health checks, dependencies
3. **Build Process**: Proper separation of dev and prod
4. **Troubleshooting**: Common issues and solutions
5. **Monitoring**: Health checks, logs, performance
6. **Best Practices**: Security, cost optimization, maintenance

Your Digital Ocean deployment will be successful when all checklist items are completed! 🚀

---

**Note**: This guide consolidates all Digital Ocean deployment knowledge into a single, comprehensive reference. For specific implementation details, refer to the configuration files mentioned in the Environment Setup section.
