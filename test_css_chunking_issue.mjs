// Test to verify CSS files are not being chunked properly
import { chunkDocumentWithoutId } from './core/indexing/chunk/chunk.js';

const cssContent = `/* Main styles for testing CSS retrieval */
body {
    background-color: #f0f0f0;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    margin: 0;
    padding: 20px;
    line-height: 1.6;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 30px;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}`;

async function testCSSChunking() {
  console.log('Testing CSS file chunking...');
  console.log('===========================');
  
  const chunks = [];
  try {
    for await (const chunk of chunkDocumentWithoutId(
      '/test/styles.css',
      cssContent,
      1000
    )) {
      chunks.push(chunk);
    }
  } catch (e) {
    console.error('Error during chunking:', e);
  }
  
  console.log(`Number of chunks generated: ${chunks.length}`);
  
  if (chunks.length === 0) {
    console.log('❌ ISSUE CONFIRMED: CSS files are not being chunked!');
  } else {
    console.log('✅ CSS file was chunked successfully');
    chunks.forEach((chunk, i) => {
      console.log(`  Chunk ${i + 1}: ${chunk.content.substring(0, 50)}...`);
    });
  }
}

testCSSChunking().catch(console.error);
