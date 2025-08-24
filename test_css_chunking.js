const path = require('path');

// Simplified version of getUriPathBasename
function getUriPathBasename(uri) {
  return path.basename(uri);
}

// The shouldChunk function from the codebase
function shouldChunk(fileUri, contents) {
  if (contents.length > 1000000) {
    // if a file has more than 1m characters then skip it
    return false;
  }
  if (contents.length === 0) {
    return false;
  }
  const baseName = getUriPathBasename(fileUri);
  return baseName.includes(".");
}

// Test CSS files
const testFiles = [
  { path: "/path/to/styles.css", content: "body { background: blue; }" },
  { path: "/path/to/main.js", content: "console.log('test');" },
  { path: "/path/to/index.html", content: "<html></html>" },
  { path: "/path/to/README.md", content: "# Test" },
  { path: "/path/to/Makefile", content: "all:" },
  { path: "/path/to/.gitignore", content: "node_modules" },
];

console.log("Testing shouldChunk function:");
console.log("==============================");

testFiles.forEach(file => {
  const result = shouldChunk(file.path, file.content);
  const basename = path.basename(file.path);
  console.log(`File: ${basename}`);
  console.log(`  Has dot: ${basename.includes(".")}`);
  console.log(`  shouldChunk: ${result}`);
  console.log();
});
