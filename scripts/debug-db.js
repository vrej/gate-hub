
const Database = require("@replit/database");
const db = new Database();

async function debugDatabase() {
  console.log('=== DATABASE DEBUG ===');
  
  try {
    // Check if applications list exists
    console.log('1. Checking applications list...');
    const appsList = await db.get('applications:list');
    console.log('Applications list raw:', appsList);
    console.log('Applications list type:', typeof appsList);
    
    // Check individual application records
    console.log('\n2. Checking individual applications...');
    for (let i = 1; i <= 5; i++) {
      const app = await db.get(`application:${i}`);
      console.log(`Application ${i}:`, app);
    }
    
    // Try to create a test application directly
    console.log('\n3. Creating test application...');
    const testApp = {
      id: 999,
      name: 'Debug Test App',
      description: 'Test application for debugging',
      department: 'IT',
      url: 'https://example.com',
      status: 'approved',
      iconType: 'default',
      approvedDepartments: []
    };
    
    await db.set('application:999', JSON.stringify(testApp));
    console.log('Test application created');
    
    // Check if it was saved
    const savedTestApp = await db.get('application:999');
    console.log('Saved test app:', savedTestApp);
    
    // Update applications list to include test app
    let currentList = [];
    try {
      const existingList = await db.get('applications:list');
      if (existingList) {
        currentList = typeof existingList === 'string' ? JSON.parse(existingList) : existingList;
        if (!Array.isArray(currentList)) currentList = [];
      }
    } catch (e) {
      console.log('Error parsing existing list:', e);
    }
    
    if (!currentList.includes(999)) {
      currentList.push(999);
      await db.set('applications:list', JSON.stringify(currentList));
      console.log('Updated applications list:', currentList);
    }
    
    // Verify the list was updated
    const updatedList = await db.get('applications:list');
    console.log('Final applications list:', updatedList);
    
  } catch (error) {
    console.error('Debug error:', error);
  }
}

debugDatabase();
