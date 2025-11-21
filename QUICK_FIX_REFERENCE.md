# Quick Fix Reference - Production Login Issue

## 🚨 The Problem

```
❌ Missing required Okta environment variables: ['VITE_OKTA_CLIENT_ID', 'VITE_OKTA_ISSUER']
```

## 🎯 The Solution

Environment variables need to be available **during build**, not after.

## ⚡ Quick Fix (Choose One)

### AWS Deployment

**See detailed guide**: [`AWS_DEPLOYMENT_FIX.md`](AWS_DEPLOYMENT_FIX.md)

**Quick steps for common AWS services:**

**Elastic Beanstalk:**

```bash
eb setenv VITE_OKTA_CLIENT_ID="0oa242e1rq8mZvw5c0h8" \
  VITE_OKTA_ISSUER="https://munchkin.okta.com/oauth2/default" \
  VITE_OKTA_REDIRECT_URI="https://application-portal.whybrands.com/login/callback"
git push && eb deploy
```

**ECS (build locally, push to ECR):**

```bash
./rebuild-with-env.sh
docker tag application-portal:latest YOUR_ACCOUNT.dkr.ecr.REGION.amazonaws.com/application-portal:latest
docker push YOUR_ACCOUNT.dkr.ecr.REGION.amazonaws.com/application-portal:latest
aws ecs update-service --cluster your-cluster --service application-portal --force-new-deployment
```

**EC2 (SSH and rebuild):**

```bash
docker build --build-arg VITE_OKTA_CLIENT_ID="0oa242e1rq8mZvw5c0h8" \
  --build-arg VITE_OKTA_ISSUER="https://munchkin.okta.com/oauth2/default" \
  --build-arg VITE_OKTA_REDIRECT_URI="https://application-portal.whybrands.com/login/callback" \
  -t application-portal .
docker stop application-portal && docker rm application-portal
docker run -d --name application-portal -p 5001:5001 --env-file .env.production application-portal
```

### Digital Ocean Dashboard

1. Go to: https://cloud.digitalocean.com/apps
2. Select your app → Settings → Edit service
3. Add these variables:
   ```
   VITE_OKTA_CLIENT_ID=<your-value>
   VITE_OKTA_ISSUER=https://<your-domain>.okta.com/oauth2/default
   VITE_OKTA_REDIRECT_URI=https://application-portal.whybrands.com/okta-callback
   ```
4. Commit updated `Dockerfile` and `app.yaml`:
   ```bash
   git add Dockerfile app.yaml
   git commit -m "Fix Okta environment variables"
   git push
   ```
5. Wait for auto-rebuild (or force rebuild in dashboard)

### Using CLI

```bash
# 1. Update app.yaml with actual values
# 2. Push changes
git add Dockerfile app.yaml
git commit -m "Fix Okta environment variables"
git push

# 3. Update app
doctl apps list  # Get APP_ID
doctl apps update <APP_ID> --spec app.yaml
```

### Local Docker Build

```bash
# 1. Create .env.production
cp env.production.example .env.production
# Edit with your values

# 2. Build with environment variables
./rebuild-with-env.sh

# 3. Push to registry
docker tag application-portal:latest your-registry/application-portal:latest
docker push your-registry/application-portal:latest
```

## 📝 Required Environment Variables

### Must Set (Build Time)

```bash
VITE_OKTA_CLIENT_ID=<your-okta-client-id>
VITE_OKTA_ISSUER=https://<your-domain>.okta.com/oauth2/default
VITE_OKTA_REDIRECT_URI=https://application-portal.whybrands.com/okta-callback
```

### Must Set (Runtime)

```bash
DATABASE_URL=postgresql://...
SESSION_SECRET=<random-string>
JWT_SECRET=<random-string>
OKTA_DOMAIN=<your-domain>.okta.com
OKTA_CLIENT_ID=<your-okta-client-id>
OKTA_CLIENT_SECRET=<your-okta-client-secret>
```

## ✅ Verify It Worked

1. Visit: https://application-portal.whybrands.com/login
2. Open console (F12)
3. Should NOT see: `❌ Missing required Okta environment variables`
4. Try logging in with Okta
5. Try logging in with username/password

## 🔍 If Still Broken

1. **Check build logs** - Did rebuild succeed?
2. **Force rebuild** - Digital Ocean → Actions → Force Rebuild
3. **Check variables** - Digital Ocean → Settings → Environment Variables
4. **Clear browser cache** - Hard refresh (Ctrl+Shift+R / Cmd+Shift+R)

## 📚 Full Documentation

- `OKTA_PRODUCTION_FIX_SUMMARY.md` - Complete summary
- `PRODUCTION_OKTA_FIX.md` - Detailed guide with troubleshooting

## ⏱️ Time Required

- Setting variables: 2 minutes
- Rebuild + deploy: 5-10 minutes
- **Total: ~15 minutes**

---

**Key Point**: `VITE_*` variables must be set **BEFORE** running `npm run build`.
They get embedded in the JavaScript bundle and cannot be changed without rebuilding.
