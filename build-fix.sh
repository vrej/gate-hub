#!/bin/bash

# Build fix script for Digital Ocean deployment
# This script handles the Rollup/Node.js compatibility issue

set -e

echo "🔧 Fixing Node.js version and Rollup issues..."

# Force Node.js 20 if available
if command -v nvm &> /dev/null; then
    echo "📦 Using nvm to set Node.js version..."
    nvm use 20
fi

echo "🧹 Cleaning previous build artifacts..."
rm -rf node_modules package-lock.json dist

echo "📦 Installing dependencies with clean slate..."
npm install

echo "🔨 Building application..."
npm run build

echo "✅ Build completed successfully!"
echo ""
echo "📁 Build output:"
echo "   - Frontend: dist/public/"
echo "   - Backend: dist/index.js"
echo ""
echo "🚀 Ready for deployment!" 