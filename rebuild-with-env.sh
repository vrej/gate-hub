#!/bin/bash

# Rebuild Docker image with Okta environment variables
# This script ensures all VITE_* variables are passed as build arguments

set -e

echo "🔧 Rebuilding Application Portal with Okta Configuration"
echo "========================================================"
echo ""

# Check if .env.production file exists
if [ ! -f .env.production ]; then
    echo "❌ Error: .env.production file not found"
    echo ""
    echo "Please create .env.production with the following variables:"
    echo "  VITE_OKTA_CLIENT_ID=your_okta_client_id"
    echo "  VITE_OKTA_ISSUER=https://your-domain.okta.com/oauth2/default"
    echo "  VITE_OKTA_REDIRECT_URI=https://application-portal.whybrands.com/okta-callback"
    echo ""
    echo "You can copy from env.production.example:"
    echo "  cp env.production.example .env.production"
    echo ""
    exit 1
fi

# Source environment variables
echo "📦 Loading environment variables from .env.production..."
export $(grep -v '^#' .env.production | xargs)

# Validate required VITE_ variables
MISSING_VARS=()

if [ -z "$VITE_OKTA_CLIENT_ID" ]; then
    MISSING_VARS+=("VITE_OKTA_CLIENT_ID")
fi

if [ -z "$VITE_OKTA_ISSUER" ]; then
    MISSING_VARS+=("VITE_OKTA_ISSUER")
fi

if [ -z "$VITE_OKTA_REDIRECT_URI" ]; then
    MISSING_VARS+=("VITE_OKTA_REDIRECT_URI")
fi

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo "❌ Error: Missing required environment variables in .env.production:"
    printf '  - %s\n' "${MISSING_VARS[@]}"
    echo ""
    echo "Please add these to your .env.production file."
    exit 1
fi

echo "✅ All required VITE_ environment variables found"
echo ""
echo "📋 Building with configuration:"
echo "  VITE_OKTA_CLIENT_ID: ${VITE_OKTA_CLIENT_ID}"
echo "  VITE_OKTA_ISSUER: ${VITE_OKTA_ISSUER}"
echo "  VITE_OKTA_REDIRECT_URI: ${VITE_OKTA_REDIRECT_URI}"
echo ""

# Build Docker image with build arguments
echo "🏗️  Building Docker image..."
docker build \
  --build-arg VITE_OKTA_CLIENT_ID="$VITE_OKTA_CLIENT_ID" \
  --build-arg VITE_OKTA_ISSUER="$VITE_OKTA_ISSUER" \
  --build-arg VITE_OKTA_REDIRECT_URI="$VITE_OKTA_REDIRECT_URI" \
  -t application-portal:latest \
  .

echo ""
echo "✅ Build completed successfully!"
echo ""
echo "🚀 To run the container:"
echo "  docker run -p 5001:5001 \\"
echo "    -e DATABASE_URL=\"\$DATABASE_URL\" \\"
echo "    -e SESSION_SECRET=\"\$SESSION_SECRET\" \\"
echo "    -e JWT_SECRET=\"\$JWT_SECRET\" \\"
echo "    -e OKTA_DOMAIN=\"\$OKTA_DOMAIN\" \\"
echo "    -e OKTA_CLIENT_ID=\"\$OKTA_CLIENT_ID\" \\"
echo "    -e OKTA_CLIENT_SECRET=\"\$OKTA_CLIENT_SECRET\" \\"
echo "    application-portal:latest"
echo ""
echo "🌐 Or to push to a registry:"
echo "  docker tag application-portal:latest your-registry/application-portal:latest"
echo "  docker push your-registry/application-portal:latest"
echo ""

