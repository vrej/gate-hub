#!/usr/bin/env node

/**
 * Test script to verify authentication is working
 */

async function testAuth() {
  console.log("🔍 Testing authentication...");

  try {
    // Test the basic endpoint
    console.log("1. Testing basic endpoint...");
    const basicResponse = await fetch("http://localhost:5001/api/test");
    console.log("Basic endpoint status:", basicResponse.status);

    // Test admin endpoint with dummy token
    console.log("2. Testing admin endpoint with dummy token...");
    const adminResponse = await fetch("http://localhost:5001/api/test-admin", {
      headers: {
        Authorization: "Bearer dummy-dev-token",
      },
    });
    console.log("Admin endpoint status:", adminResponse.status);

    if (adminResponse.ok) {
      const adminData = await adminResponse.json();
      console.log("Admin endpoint response:", adminData);
    } else {
      const errorText = await adminResponse.text();
      console.log("Admin endpoint error:", errorText);
    }

    // Test department creation with dummy token
    console.log("3. Testing department creation...");
    const deptResponse = await fetch("http://localhost:5001/api/departments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer dummy-dev-token",
      },
      body: JSON.stringify({
        name: "Test Department",
        description: "Test department for authentication testing",
      }),
    });
    console.log("Department creation status:", deptResponse.status);

    if (deptResponse.ok) {
      const deptData = await deptResponse.json();
      console.log("Department created:", deptData);
    } else {
      const errorText = await deptResponse.text();
      console.log("Department creation error:", errorText);
    }
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testAuth();
