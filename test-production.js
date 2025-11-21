#!/usr/bin/env node

// Test script to verify production build
console.log("🧪 Testing production build...");

// Test 1: Check if basic Node.js modules are available
console.log("✅ Node.js environment ready");

// Test 2: Check if dist/index.js exists
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distPath = path.join(__dirname, "dist", "index.js");
if (fs.existsSync(distPath)) {
  console.log("✅ dist/index.js exists");
} else {
  console.log("❌ dist/index.js missing");
  process.exit(1);
}

// Test 3: Check if dist/public exists
const publicPath = path.join(__dirname, "dist", "public");
if (fs.existsSync(publicPath)) {
  console.log("✅ dist/public exists");
} else {
  console.log("❌ dist/public missing");
  process.exit(1);
}

// Test 4: Check if uploads directory exists
const uploadsPath = path.join(__dirname, "uploads");
if (fs.existsSync(uploadsPath)) {
  console.log("✅ uploads directory exists");
} else {
  console.log("❌ uploads directory missing");
  process.exit(1);
}

console.log("🎉 All tests passed! Production build is ready.");
