#!/bin/bash

# Build script for Digital Ocean deployment
# This script ensures the correct Node.js version and handles the build process

set -e

echo "🔧 Checking Node.js version..."
NODE_VERSION=$(node --version)
echo "Current Node.js version: $NODE_VERSION"

# Check if we're using Node.js 20
if [[ $NODE_VERSION != v20* ]]; then
    echo "⚠️  Warning: You're not using Node.js 20. The deployment will use Node.js 20 automatically."
    echo "   For local development, consider using Node.js 20 for consistency."
fi

echo "🧹 Cleaning previous build..."
rm -rf dist

echo "📦 Installing dependencies..."
npm ci

echo "🔨 Building application..."
npm run build

echo "✅ Build completed successfully!"
echo ""
echo "📁 Build output:"
echo "   - Frontend: dist/public/"
echo "   - Backend: dist/index.js"
echo ""
echo "🚀 Ready for deployment!" 