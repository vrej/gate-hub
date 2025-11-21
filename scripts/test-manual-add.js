
const Database = require("@replit/database");
const db = new Database();

async function testManualAdd() {
  try {
    console.log('=== TESTING MANUAL APPLICATION ADD ===');
    
    // Clear existing data for clean test
    await db.set('applications:list', JSON.stringify([]));
    console.log('Cleared applications list');
    
    // Test application
    const testApp = {
      id: 1,
      name: "Test Application",
      description: "This is a test application to verify database functionality",
      department: "IT",
      url: "https://example.com",
      status: "approved",
      iconType: "default",
      approvedDepartments: []
    };
    
    // Save application
    console.log('Saving test application...');
    await db.set('application:1', JSON.stringify(testApp));
    console.log('✓ Application saved');
    
    // Update applications list
    console.log('Updating applications list...');
    await db.set('applications:list', JSON.stringify([1]));
    console.log('✓ Applications list updated');
    
    // Verify data was saved
    console.log('\n=== VERIFICATION ===');
    const savedList = await db.get('applications:list');
    console.log('Saved applications list:', savedList);
    
    const savedApp = await db.get('application:1');
    console.log('Saved application:', savedApp);
    
    console.log('\n=== TEST COMPLETED ===');
    
  } catch (error) {
    console.error('Error in manual test:', error);
  }
}

testManualAdd()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
