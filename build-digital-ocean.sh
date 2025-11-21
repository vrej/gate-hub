#!/bin/bash

echo "🚀 Building for Digital Ocean..."

# Ensure we're in the right directory
cd /workspace || cd .

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Install dev dependencies for build
echo "🔧 Installing dev dependencies..."
npm install --only=dev

# Run the build
echo "🏗️ Running build..."
npm run build

# Clean up dev dependencies to reduce image size
echo "🧹 Cleaning up dev dependencies..."
npm prune --production

echo "✅ Build completed successfully!" 