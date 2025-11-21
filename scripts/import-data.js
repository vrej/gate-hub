
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

// Import the database functionality
const Database = require("@replit/database");
const db = new Database();

async function importCsvData() {
  try {
    console.log('Starting CSV import...');
    
    // Check if files exist
    const originalCsvPath = path.join(process.cwd(), 'attached_assets/AI_at_MUN-7-2024(AI - 2024)_1750966039429.csv');
    const convertedCsvPath = path.join(process.cwd(), 'attached_assets/converted-data.csv');
    
    console.log('Checking for files...');
    console.log('Original file exists:', fs.existsSync(originalCsvPath));
    console.log('Converted file exists:', fs.existsSync(convertedCsvPath));
    
    let csvContent = '';
    let csvPath = '';
    
    // Try converted file first, then original
    if (fs.existsSync(convertedCsvPath)) {
      console.log('Using converted CSV file');
      csvContent = fs.readFileSync(convertedCsvPath, 'utf8');
      csvPath = convertedCsvPath;
    } else if (fs.existsSync(originalCsvPath)) {
      console.log('Using original CSV file');
      try {
        csvContent = fs.readFileSync(originalCsvPath, 'utf8');
        csvPath = originalCsvPath;
      } catch (error) {
        console.log('Original file encoding issue, trying latin1');
        const buffer = fs.readFileSync(originalCsvPath);
        const iconv = require('iconv-lite');
        csvContent = iconv.decode(buffer, 'latin1');
        csvPath = originalCsvPath;
      }
    } else {
      console.error('No CSV file found');
      return;
    }

    console.log('CSV file path:', csvPath);
    console.log('CSV content length:', csvContent.length);
    console.log('CSV content preview (first 500 chars):');
    console.log(csvContent.substring(0, 500));
    console.log('---END PREVIEW---');

    // Parse CSV
    let records;
    try {
      records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        delimiter: ',',
        quote: '"',
        escape: '"'
      });
    } catch (parseError) {
      console.error('CSV parsing error:', parseError);
      // Try with different delimiter
      try {
        console.log('Trying with semicolon delimiter...');
        records = parse(csvContent, {
          columns: true,
          skip_empty_lines: true,
          trim: true,
          delimiter: ';',
          quote: '"',
          escape: '"'
        });
      } catch (parseError2) {
        console.error('CSV parsing failed with both delimiters:', parseError2);
        return;
      }
    }

    console.log(`Found ${records.length} records to import`);
    
    if (records.length > 0) {
      console.log('First record structure:', JSON.stringify(records[0], null, 2));
      console.log('Available columns:', Object.keys(records[0]));
    } else {
      console.log('No records found in CSV');
      return;
    }

    // Clear existing applications list and start fresh for testing
    await db.set('applications:list', JSON.stringify([]));
    console.log('Cleared existing applications list');

    let importCount = 0;
    let nextId = 1;
    const errors = [];

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      console.log(`Processing record ${i + 1}:`, JSON.stringify(record, null, 2));
      
      try {
        // Try to map all possible column variations
        const possibleNames = [
          record.name, record.Name, record.NAME,
          record.title, record.Title, record.TITLE,
          record.application, record.Application, record.APPLICATION,
          record.app, record.App, record.APP,
          record.tool, record.Tool, record.TOOL,
          record.software, record.Software, record.SOFTWARE
        ].filter(Boolean);
        
        const possibleDescriptions = [
          record.description, record.Description, record.DESCRIPTION,
          record.desc, record.Desc, record.DESC,
          record.details, record.Details, record.DETAILS,
          record.summary, record.Summary, record.SUMMARY,
          record.info, record.Info, record.INFO
        ].filter(Boolean);
        
        const possibleDepartments = [
          record.department, record.Department, record.DEPARTMENT,
          record.category, record.Category, record.CATEGORY,
          record.dept, record.Dept, record.DEPT,
          record.division, record.Division, record.DIVISION,
          record.team, record.Team, record.TEAM
        ].filter(Boolean);
        
        const possibleUrls = [
          record.url, record.URL, record.Url,
          record.link, record.Link, record.LINK,
          record.website, record.Website, record.WEBSITE,
          record.site, record.Site, record.SITE
        ].filter(Boolean);

        // Create application object
        const application = {
          id: nextId,
          name: possibleNames[0] || `Application ${nextId}`,
          description: possibleDescriptions[0] || possibleNames[0] || `Imported application ${nextId}`,
          department: possibleDepartments[0] || 'General',
          url: possibleUrls[0] || '',
          status: 'approved',
          iconType: 'default',
          approvedDepartments: []
        };

        console.log(`Creating application:`, JSON.stringify(application, null, 2));

        // Save application
        await db.set(`application:${nextId}`, JSON.stringify(application));
        
        console.log(`✓ Imported: ${application.name}`);
        importCount++;
        nextId++;
        
      } catch (error) {
        console.error(`Error importing record ${i + 1}:`, error);
        errors.push({ record, error: error.message });
      }
    }

    // Update applications list with all IDs
    const allIds = [];
    for (let i = 1; i < nextId; i++) {
      allIds.push(i);
    }
    await db.set('applications:list', JSON.stringify(allIds));
    
    console.log(`\n=== IMPORT SUMMARY ===`);
    console.log(`Successfully imported ${importCount} applications`);
    console.log(`Application IDs: [${allIds.join(', ')}]`);
    console.log(`Errors: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('\nErrors encountered:');
      errors.forEach((error, index) => {
        console.log(`Error ${index + 1}:`, error);
      });
    }

    // Verify data was saved
    console.log('\n=== VERIFICATION ===');
    const savedList = await db.get('applications:list');
    console.log('Saved applications list:', savedList);
    
    for (let i = 1; i <= 3 && i < nextId; i++) {
      const savedApp = await db.get(`application:${i}`);
      console.log(`Application ${i}:`, savedApp);
    }
    
  } catch (error) {
    console.error('Fatal error during import:', error);
  }
}

console.log('=== STARTING CSV IMPORT SCRIPT ===');
importCsvData()
  .then(() => {
    console.log('=== IMPORT SCRIPT COMPLETED ===');
    process.exit(0);
  })
  .catch((error) => {
    console.error('=== IMPORT SCRIPT FAILED ===', error);
    process.exit(1);
  });
