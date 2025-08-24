import { describe, expect, test } from "vitest";
import { chunkDocumentWithoutId } from "./chunk";
import { ChunkWithoutID } from "../../index";

describe("CSS file chunking", () => {
  test("should chunk CSS files using basicChunker", async () => {
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
}

h1 {
    color: #333;
    font-size: 2.5em;
    border-bottom: 3px solid #0066cc;
    padding-bottom: 10px;
    margin-bottom: 20px;
}`;

    const chunks: ChunkWithoutID[] = [];
    for await (const chunk of chunkDocumentWithoutId(
      "/test/styles.css",
      cssContent,
      1000
    )) {
      chunks.push(chunk);
    }

    // Should generate at least one chunk
    expect(chunks.length).toBeGreaterThan(0);
    
    // The chunk should contain CSS content
    expect(chunks[0].content).toContain("body");
    expect(chunks[0].content).toContain("background-color");
  });

  test("should chunk HTML files using basicChunker", async () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Test Page</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <h1>Test CSS Indexing</h1>
        <p>This is a test page to verify CSS file indexing.</p>
    </div>
</body>
</html>`;

    const chunks: ChunkWithoutID[] = [];
    for await (const chunk of chunkDocumentWithoutId(
      "/test/index.html",
      htmlContent,
      1000
    )) {
      chunks.push(chunk);
    }

    // Should generate at least one chunk
    expect(chunks.length).toBeGreaterThan(0);
    
    // The chunk should contain HTML content
    expect(chunks[0].content).toContain("<!DOCTYPE html>");
    expect(chunks[0].content).toContain("container");
  });

  test("should chunk JSON files using basicChunker", async () => {
    const jsonContent = `{
  "name": "test-package",
  "version": "1.0.0",
  "description": "Test package for CSS indexing",
  "main": "index.js",
  "scripts": {
    "test": "echo 'Error: no test specified' && exit 1"
  },
  "author": "",
  "license": "MIT"
}`;

    const chunks: ChunkWithoutID[] = [];
    for await (const chunk of chunkDocumentWithoutId(
      "/test/package.json",
      jsonContent,
      1000
    )) {
      chunks.push(chunk);
    }

    // Should generate at least one chunk
    expect(chunks.length).toBeGreaterThan(0);
    
    // The chunk should contain JSON content
    expect(chunks[0].content).toContain("name");
    expect(chunks[0].content).toContain("test-package");
  });

  test("should still use codeChunker for JavaScript files", async () => {
    const jsContent = `function testFunction() {
    console.log("This is a test");
    return true;
}

class TestClass {
    constructor() {
        this.value = 42;
    }
    
    getValue() {
        return this.value;
    }
}`;

    const chunks: ChunkWithoutID[] = [];
    for await (const chunk of chunkDocumentWithoutId(
      "/test/script.js",
      jsContent,
      1000
    )) {
      chunks.push(chunk);
    }

    // Should generate at least one chunk
    expect(chunks.length).toBeGreaterThan(0);
    
    // The chunk should contain JavaScript content
    expect(chunks[0].content).toContain("function");
  });
});
