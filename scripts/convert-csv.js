
const fs = require('fs');
const path = require('path');
const iconv = require('iconv-lite');

// Convert the CSV file to UTF-8
const inputFile = path.join(process.cwd(), 'attached_assets/AI_at_MUN-7-2024(AI - 2024)_1750966039429.csv');
const outputFile = path.join(process.cwd(), 'attached_assets/converted-data.csv');

try {
  // Try different encodings
  const encodings = ['latin1', 'windows-1252', 'iso-8859-1'];
  
  for (const encoding of encodings) {
    try {
      console.log(`Trying encoding: ${encoding}`);
      const buffer = fs.readFileSync(inputFile);
      const text = iconv.decode(buffer, encoding);
      
      // Check if conversion was successful
      if (text && !text.includes('�')) {
        const utf8Text = iconv.encode(text, 'utf8');
        fs.writeFileSync(outputFile, utf8Text);
        console.log(`Successfully converted file using ${encoding} encoding`);
        console.log(`Output saved to: ${outputFile}`);
        break;
      }
    } catch (err) {
      console.log(`Failed with ${encoding}: ${err.message}`);
    }
  }
  
} catch (error) {
  console.error('Error converting file:', error.message);
}
