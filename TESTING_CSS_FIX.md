# Testing Guide: CSS File Retrieval Fix

## Summary of the Fix

This fix addresses issue #7072 where CSS files weren't being retrieved by the @Codebase context provider even though they were properly indexed. The solution enhances the FTS (Full-Text Search) query builder to:

1. **Extract file paths** from queries (e.g., "styles.css")
2. **Add extension-based hints** for common keywords (e.g., "css", "stylesheet")
3. **Keep trigram generation** for semantic search (existing behavior)
4. **Add unigram fallback** for short queries
5. **Use path-column searches** in SQLite FTS5

## What Changed

- **File Modified**: `core/context/retrieval/pipelines/BaseRetrievalPipeline.ts`
  - Added `buildFtsMatchString()` method
  - Modified `retrieveFts()` to use the new query builder
  - Removed debug console.log statements

- **Tests Added**: `core/context/retrieval/pipelines/BaseRetrievalPipeline.vitest.ts`
  - 10 comprehensive test cases for various query patterns

## How to Test

### 1. Prerequisites

```bash
# Navigate to the continue-dev directory
cd /Users/krshv/continue-dev

# Install dependencies if not already done
cd core && npm install
cd ../extensions/vscode && npm install
```

### 2. Run Unit Tests

```bash
# Run the specific test file
cd /Users/krshv/continue-dev/core
npm run vitest -- BaseRetrievalPipeline.vitest.ts

# Expected output: All 10 tests should pass
```

### 3. Manual Testing in VS Code

#### Step 1: Build and Install the Extension

```bash
# Build the VS Code extension with the fix
cd /Users/krshv/continue-dev/extensions/vscode
npm run package

# This creates a .vsix file in the build/ directory
# Install it in VS Code:
# 1. Open VS Code
# 2. Go to Extensions (Cmd+Shift+X)
# 3. Click "..." menu > "Install from VSIX..."
# 4. Select the generated .vsix file
```

#### Step 2: Create a Test Workspace

Create a new directory with test files:

```bash
mkdir ~/test-css-retrieval
cd ~/test-css-retrieval

# Create test files
cat > index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <h1>Test Page</h1>
    <script src="scripts.js"></script>
</body>
</html>
EOF

cat > styles.css << 'EOF'
body {
    background-color: #f00;
    font-family: Arial, sans-serif;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
}

.btn {
    background-color: #0066cc;
    color: white;
    padding: 10px 20px;
}
EOF

cat > scripts.js << 'EOF'
function changeBackgroundColor(color) {
    document.body.style.backgroundColor = color;
}

document.addEventListener('DOMContentLoaded', function() {
    console.log("Page loaded");
});
EOF
```

#### Step 3: Test Queries with @Codebase

Open the test workspace in VS Code and try these queries in Continue:

1. **Test direct file reference**:
   ```
   @Codebase styles.css
   ```
   ✅ Should include styles.css in the context

2. **Test extension keyword**:
   ```
   @Codebase what CSS styles are defined?
   ```
   ✅ Should include styles.css in the context

3. **Test content-based query**:
   ```
   @Codebase change the background color
   ```
   ✅ Should include styles.css (contains background-color)

4. **Test stylesheet keyword**:
   ```
   @Codebase update the stylesheet
   ```
   ✅ Should include styles.css

5. **Test mixed file types**:
   ```
   @Codebase show me all files
   ```
   ✅ Should include index.html, styles.css, and scripts.js

### 4. Verify No Regressions

Test that existing functionality still works:

1. **JavaScript files**:
   ```
   @Codebase scripts.js
   ```
   ✅ Should include scripts.js

2. **HTML files**:
   ```
   @Codebase index.html
   ```
   ✅ Should include index.html

3. **Long semantic queries**:
   ```
   @Codebase implement user authentication system
   ```
   ✅ Should use trigram matching (existing behavior)

### 5. Check the Generated FTS Query (Debug)

If you want to see what FTS query is generated, you can temporarily add logging:

```typescript
// In BaseRetrievalPipeline.ts, line 223 (after buildFtsMatchString call)
console.log("FTS Query for:", args.query, "=>", matchString);
```

Example outputs:
- Query: "styles.css" → `path:"styles.css" OR path:"css" OR path:"scss" OR path:"sass" OR path:"less" OR "styles" OR "css"`
- Query: "css" → `path:"css" OR path:"scss" OR path:"sass" OR path:"less" OR "css"`
- Query: "change background color" → `"chang" OR "background" OR "color"`

### 6. Performance Testing

The fix should not impact performance:

1. **Query speed**: FTS queries should remain fast (< 100ms for most codebases)
2. **Match string size**: Generated MATCH strings are reasonable (typically < 500 chars)
3. **Memory usage**: No additional memory overhead

### 7. Edge Cases to Test

1. **Empty query**: Should return empty results (not crash)
2. **Very long query**: Should handle gracefully with trigrams
3. **Special characters in filenames**: Properly escaped
4. **Multiple file extensions**: All recognized and included
5. **Case sensitivity**: "CSS" and "css" both work

## Troubleshooting

If CSS files are still not being retrieved:

1. **Check indexing is enabled**:
   - Continue settings → Indexing should be ON
   - Try reindexing: Command Palette → "Continue: Rebuild Index"

2. **Verify files are indexed**:
   ```bash
   # Check the SQLite database
   sqlite3 ~/.continue/index/index.sqlite
   sqlite> SELECT path FROM chunks WHERE path LIKE '%.css';
   ```

3. **Check embeddings provider** (optional):
   - FTS works without embeddings
   - But having an embeddings model improves results

4. **Clear cache and reindex**:
   ```bash
   rm -rf ~/.continue/index/
   # Then restart VS Code and let it reindex
   ```

## Expected Behavior

✅ **FIXED**: CSS files are now retrieved for:
- Direct file references ("styles.css")  
- Extension keywords ("css", "stylesheet", "styles")
- Content queries that match CSS content
- Short queries (1-2 words)

✅ **PRESERVED**: Existing functionality:
- Trigram matching for longer queries
- Other file types (JS, HTML, etc.)
- Embeddings-based retrieval (if configured)
- Recently edited files
- Repo map integration

## Implementation Details

The fix works by building a more comprehensive FTS MATCH string:

1. **Path clauses**: `path:"styles.css"` for exact file matching
2. **Extension hints**: `path:"css"` for extension-based matching  
3. **Trigrams**: For semantic search (3+ word queries)
4. **Unigrams**: Individual tokens when trigrams insufficient
5. **OR operator**: Combines all clauses for inclusive matching

This ensures CSS files match through multiple pathways, making retrieval more robust.

## Reporting Issues

If you still experience issues after applying this fix:

1. Check which Continue version you're using
2. Verify the fix is included (check BaseRetrievalPipeline.ts has buildFtsMatchString method)
3. Collect:
   - Your query that failed
   - The expected files
   - What was actually retrieved
   - Your Continue configuration
4. Report in the GitHub issue #7072

## PR Information

- **Branch**: `fix/codebase-css-fts`
- **Commit**: `f3bed0b66` 
- **Files changed**: 
  - `core/context/retrieval/pipelines/BaseRetrievalPipeline.ts`
  - `core/context/retrieval/pipelines/BaseRetrievalPipeline.vitest.ts`
- **Tests**: 10 unit tests, all passing
- **Risk**: Minimal - changes isolated to FTS query building
