#!/bin/bash

echo "🔧 Fixing Digital Ocean deployment issues..."

# Ensure ws package is in dependencies
if ! grep -q '"ws"' package.json; then
    echo "❌ ws package not found in dependencies"
    echo "Adding ws package to dependencies..."
    npm install ws
fi

# Ensure @types/ws is in devDependencies
if ! grep -q '"@types/ws"' package.json; then
    echo "❌ @types/ws package not found in devDependencies"
    echo "Adding @types/ws package to devDependencies..."
    npm install --save-dev @types/ws
fi

# Test build
echo "🧪 Testing build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "✅ Ready for Digital Ocean deployment"
else
    echo "❌ Build failed!"
    exit 1
fi 