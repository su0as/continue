// Test to understand why CSS files aren't being chunked

const fs = require('fs');
const crypto = require('crypto');

// Read the actual CSS file
const cssPath = '/Users/krshv/test-css-codebase/styles.css';
const cssContent = fs.readFileSync(cssPath, 'utf8');

console.log('CSS File Analysis:');
console.log('==================');
console.log('Path:', cssPath);
console.log('Content:', JSON.stringify(cssContent));
console.log('Content length:', cssContent.length);
console.log('Content bytes:', Buffer.byteLength(cssContent));

// Calculate hash like the indexer does
const hash = crypto.createHash('sha256');
hash.update(cssContent);
const cacheKey = hash.digest('hex');
console.log('Computed cacheKey:', cacheKey);

// Check empty/whitespace
console.log('Is empty:', cssContent.trim() === '');
console.log('Has content:', cssContent.length > 0);

// Check file size limits
console.log('Under 1MB character limit:', cssContent.length <= 1000000);
console.log('Under 5MB byte limit:', Buffer.byteLength(cssContent) <= 5 * 1024 * 1024);
