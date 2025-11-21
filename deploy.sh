#!/bin/bash

# Digital Ocean App Platform Deployment Script
# This script helps deploy the WhyBrands Application Portal to Digital Ocean

set -e

echo "🚀 Starting Digital Ocean deployment..."

# Check if doctl is installed
if ! command -v doctl &> /dev/null; then
    echo "❌ doctl is not installed. Please install it first:"
    echo "   macOS: brew install doctl"
    echo "   Or download from: https://github.com/digitalocean/doctl/releases"
    exit 1
fi

# Check if user is authenticated
if ! doctl auth list &> /dev/null; then
    echo "❌ Not authenticated with Digital Ocean. Please run:"
    echo "   doctl auth init"
    exit 1
fi

# Check if app.yaml exists
if [ ! -f "app.yaml" ]; then
    echo "❌ app.yaml not found. Please create it first."
    exit 1
fi

# Check if Dockerfile exists
if [ ! -f "Dockerfile" ]; then
    echo "❌ Dockerfile not found. Please create it first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Build the application locally to test
echo "🔨 Building application locally..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed. Please fix the build issues first."
    exit 1
fi

# Deploy to Digital Ocean
echo "🌊 Deploying to Digital Ocean..."
doctl apps create --spec app.yaml

echo "✅ Deployment initiated!"
echo ""
echo "📋 Next steps:"
echo "1. Check the deployment status in Digital Ocean dashboard"
echo "2. Set up your environment variables in the app settings"
echo "3. Configure your database connection"
echo "4. Run database migrations: npm run db:push"
echo ""
echo "🔗 View your app in the Digital Ocean dashboard:"
echo "   https://cloud.digitalocean.com/apps" 