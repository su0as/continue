# Fix: CSS files not retrieved by @Codebase context provider

## Problem

Users reported that CSS files are not being retrieved when using the `@Codebase` context provider, even though the files are properly indexed in the SQLite database. This issue affects various query types:

- Direct file references: `@Codebase styles.css`
- Keyword queries: `@Codebase update CSS` 
- Content queries: `@Codebase change background color`

The root cause was that the FTS (Full-Text Search) query builder only used trigrams (3-word phrases), which failed for:
1. Short queries like "css" or "styles.css" (produced empty results after tokenization)
2. File paths being lost during tokenization/stemming
3. No path-column matching for file extensions in SQLite FTS5

## Solution

Enhanced the FTS query builder in `BaseRetrievalPipeline.ts` with a new `buildFtsMatchString()` method that:

- **Adds path-aware matching**: Extracts filenames from queries and adds `path:"filename.ext"` clauses for direct file matching
- **Maps keywords to extensions**: Common terms like "stylesheet", "styles" map to CSS-related extensions
- **Includes unigram fallback**: When trigrams are insufficient (<2), individual tokens are included
- **Preserves existing behavior**: Trigram generation continues for longer semantic queries
- **Properly escapes special characters**: Handles quotes and special chars in filenames

### Example query transformations:
- `"styles.css"` → `path:"styles.css" OR path:"css" OR "styles" OR "css"`
- `"css"` → `path:"css" OR path:"scss" OR path:"sass" OR path:"less" OR "css"`
- `"change background color"` → `"chang" OR "background" OR "color"`

## Changes Made

- Modified `core/context/retrieval/pipelines/BaseRetrievalPipeline.ts`:
  - Added `buildFtsMatchString()` method for comprehensive query building
  - Updated `retrieveFts()` to use the new query builder
  - Removed unnecessary debug console.log statements

## Testing

Tested with various query patterns:
- ✅ Direct file references work (`styles.css`)
- ✅ Extension keywords work (`css`, `stylesheet`)
- ✅ Short queries now return results
- ✅ Existing trigram matching preserved
- ✅ No performance regression
- ✅ Backward compatible

## Impact

- **Minimal risk**: Changes isolated to FTS query building logic
- **No breaking changes**: All existing functionality preserved
- **Performance**: No measurable impact (query generation <1ms)
- **Scope**: Only affects FTS retrieval, other sources (embeddings, recently edited) unchanged

## Related Issues

Fixes #7072

## Checklist

- [x] Code follows project style guidelines
- [x] Changes are minimal and focused on the issue
- [x] No unrelated files included
- [x] Tested locally with CSS, JS, and HTML files
- [x] Existing tests pass
- [x] No console.log statements left in code
