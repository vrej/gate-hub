#!/bin/bash

# Test production build locally with environment variables
# This script verifies that VITE_* variables are properly embedded

set -e

echo "🧪 Testing Production Build with Environment Variables"
echo "========================================================"
echo ""

# Check if .env.production file exists
if [ ! -f .env.production ]; then
    echo "⚠️  Warning: .env.production file not found"
    echo "Creating from template..."
    if [ -f env.production.example ]; then
        cp env.production.example .env.production
        echo "✅ Created .env.production from template"
        echo "⚠️  Please edit .env.production with your actual values"
        exit 1
    else
        echo "❌ Error: env.production.example not found"
        exit 1
    fi
fi

# Source environment variables
echo "📦 Loading environment variables from .env.production..."
export $(grep -v '^#' .env.production | grep -v '^$' | xargs)

# Validate required VITE_ variables
echo "🔍 Validating required VITE_ environment variables..."
MISSING_VARS=()

if [ -z "$VITE_OKTA_CLIENT_ID" ]; then
    MISSING_VARS+=("VITE_OKTA_CLIENT_ID")
fi

if [ -z "$VITE_OKTA_ISSUER" ]; then
    MISSING_VARS+=("VITE_OKTA_ISSUER")
fi

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo "❌ Error: Missing required environment variables:"
    printf '  - %s\n' "${MISSING_VARS[@]}"
    echo ""
    echo "Please add these to your .env.production file."
    exit 1
fi

echo "✅ All required VITE_ environment variables found"
echo ""
echo "📋 Configuration:"
echo "  VITE_OKTA_CLIENT_ID: ${VITE_OKTA_CLIENT_ID:0:20}..."
echo "  VITE_OKTA_ISSUER: ${VITE_OKTA_ISSUER}"
echo "  VITE_OKTA_REDIRECT_URI: ${VITE_OKTA_REDIRECT_URI:-${window.location.origin}/okta-callback}"
echo ""

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf dist

# Build the application
echo "🔨 Building application..."
npm run build

# Check if build succeeded
if [ ! -d "dist/public" ]; then
    echo "❌ Build failed: dist/public directory not found"
    exit 1
fi

echo "✅ Build completed successfully!"
echo ""

# Verify environment variables are embedded in the bundle
echo "🔍 Verifying environment variables are embedded in bundle..."
BUNDLE_FILE=$(find dist/public/assets -name "index-*.js" | head -n 1)

if [ -z "$BUNDLE_FILE" ]; then
    echo "❌ Error: Could not find built JavaScript bundle"
    exit 1
fi

echo "📦 Checking bundle: $BUNDLE_FILE"

# Check if Okta issuer is in the bundle
if grep -q "$VITE_OKTA_ISSUER" "$BUNDLE_FILE"; then
    echo "✅ VITE_OKTA_ISSUER found in bundle"
else
    echo "❌ VITE_OKTA_ISSUER NOT found in bundle"
    echo "   This means environment variables were not embedded during build"
    exit 1
fi

# Check if client ID is in the bundle
if grep -q "$VITE_OKTA_CLIENT_ID" "$BUNDLE_FILE"; then
    echo "✅ VITE_OKTA_CLIENT_ID found in bundle"
else
    echo "❌ VITE_OKTA_CLIENT_ID NOT found in bundle"
    echo "   This means environment variables were not embedded during build"
    exit 1
fi

# Check that import.meta.env references are replaced
if grep -q "import\.meta\.env\.VITE_OKTA" "$BUNDLE_FILE"; then
    echo "⚠️  Warning: Found unreplaced import.meta.env references"
    echo "   This suggests environment variables might not be fully embedded"
else
    echo "✅ No unreplaced import.meta.env references found"
fi

echo ""
echo "✅ Production build verification passed!"
echo ""
echo "📊 Build output:"
echo "  - Frontend: dist/public/"
echo "  - Backend: dist/index.js"
echo "  - Bundle size: $(du -h "$BUNDLE_FILE" | cut -f1)"
echo ""
echo "🚀 To test locally:"
echo "  1. Make sure you have a PostgreSQL database running"
echo "  2. Set runtime environment variables (DATABASE_URL, SESSION_SECRET, etc.)"
echo "  3. Run: npm run start"
echo "  4. Visit: http://localhost:5001"
echo ""
echo "🐳 To build Docker image:"
echo "  ./rebuild-with-env.sh"
echo ""

