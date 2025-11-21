#!/bin/bash

# Fix Rollup issue script
# This script fixes the @rollup/rollup-linux-x64-gnu module issue

echo "🔧 Fixing Rollup compatibility issue..."

# Check if we're in a Linux environment
if [[ "$OSTYPE" == "linux-gnu"* ]] || [[ "$OSTYPE" == "linux"* ]]; then
    echo "🐧 Linux environment detected"
    
    # Force install the Rollup Linux binary
    echo "📦 Installing Rollup Linux binary..."
    npm install @rollup/rollup-linux-x64-gnu --no-save --force
    
    # Verify installation
    if npm list @rollup/rollup-linux-x64-gnu > /dev/null 2>&1; then
        echo "✅ Rollup Linux binary installed successfully"
    else
        echo "⚠️ Rollup Linux binary installation may have failed, but continuing..."
    fi
else
    echo "💻 Non-Linux environment, skipping Rollup binary fix"
fi

echo "✅ Rollup fix completed" 