# Testing Guide: Docs Search and Alphabetical Sort

## Quick Setup

1. **Start the GUI development server:**
```bash
cd gui
npm run dev
```
The GUI will be available at http://localhost:5173

2. **Configure test documentation sources:**

Edit or create the config file at `extensions/.continue-debug/config.json`:

```json
{
  "models": [
    {
      "model": "gpt-4",
      "provider": "openai",
      "apiKey": "YOUR_API_KEY"
    }
  ],
  "docs": [
    {
      "title": "React Documentation",
      "startUrl": "https://react.dev/reference/react"
    },
    {
      "title": "TypeScript Handbook",
      "startUrl": "https://www.typescriptlang.org/docs/"
    },
    {
      "title": "Node.js API",
      "startUrl": "https://nodejs.org/api/"
    },
    {
      "title": "MDN Web Docs",
      "startUrl": "https://developer.mozilla.org/"
    },
    {
      "title": "Python Documentation",
      "startUrl": "https://docs.python.org/3/"
    },
    {
      "title": "AWS Documentation",
      "startUrl": "https://docs.aws.amazon.com/"
    },
    {
      "title": "Docker Docs",
      "startUrl": "https://docs.docker.com/"
    },
    {
      "title": "Kubernetes Documentation",
      "startUrl": "https://kubernetes.io/docs/"
    },
    {
      "startUrl": "https://golang.org/doc/"
    },
    {
      "title": "Vue.js Guide",
      "startUrl": "https://vuejs.org/guide/"
    },
    {
      "title": "Angular Documentation",
      "startUrl": "https://angular.io/docs"
    },
    {
      "title": "Django Documentation",
      "startUrl": "https://docs.djangoproject.com/"
    }
  ]
}
```

## Test Cases

### 1. Alphabetical Sorting
**Expected:** Documentation entries should be sorted A-Z by title
- ✅ Angular Documentation
- ✅ AWS Documentation  
- ✅ Django Documentation
- ✅ Docker Docs
- ✅ Kubernetes Documentation
- ✅ MDN Web Docs
- ✅ Node.js API
- ✅ Python Documentation
- ✅ React Documentation
- ✅ TypeScript Handbook
- ✅ Vue.js Guide
- ✅ https://golang.org/doc/ (no title, sorted by URL at the end)

### 2. Search Functionality

#### Test Case 2.1: Search by Title
- Type "react" → Should show only "React Documentation"
- Type "doc" → Should show multiple entries containing "doc" in title

#### Test Case 2.2: Search by URL
- Type "angular.io" → Should show "Angular Documentation"
- Type ".org" → Should show all entries with .org domains

#### Test Case 2.3: Case Insensitive
- Type "PYTHON" → Should show "Python Documentation"
- Type "typescript" → Should show "TypeScript Handbook"

#### Test Case 2.4: Partial Matches
- Type "script" → Should match "TypeScript Handbook"
- Type "node" → Should match "Node.js API"

#### Test Case 2.5: Clear Search
- Type any search term
- Click the X icon
- All documentation entries should reappear

#### Test Case 2.6: Empty/Whitespace Search
- Type only spaces → Should show all entries
- Clear the field → Should show all entries

### 3. Edge Cases

#### Test Case 3.1: No Results
- Type "xyz123" → Should show empty list (no errors)

#### Test Case 3.2: Special Characters
- Add docs with special characters in config:
```json
{
  "title": "C++ Reference",
  "startUrl": "https://cppreference.com"
},
{
  "title": "C# Documentation",  
  "startUrl": "https://docs.microsoft.com/dotnet/csharp"
}
```
- Search for "C++" or "C#" should work correctly

## Testing in VS Code Extension

1. **Package the extension:**
```bash
cd extensions/vscode
npm run package
```

2. **Install the VSIX:**
- Open VS Code
- Go to Extensions view (Cmd+Shift+X)
- Click "..." menu → "Install from VSIX..."
- Select `extensions/vscode/build/continue-*.vsix`

3. **Open Continue panel:**
- Press Cmd+Shift+P → "Continue: Focus Continue View"
- Navigate to the settings/configuration section
- Find the Docs section
- Verify search and sort work as expected

## Testing in JetBrains (Optional)

1. **Build the plugin:**
```bash
cd extensions/intellij
./gradlew buildPlugin
```

2. **Install in IntelliJ:**
- Go to Settings → Plugins → ⚙️ → Install Plugin from Disk
- Select `extensions/intellij/build/distributions/continue-intellij-*.zip`
- Restart IDE

3. **Test the feature:**
- Open Continue panel
- Navigate to docs section
- Verify search and sort functionality

## Performance Testing

With many docs (50+ entries):
1. Scrolling should remain smooth
2. Search should be responsive (no lag while typing)
3. Sorting should be instant
4. No memory leaks after repeated searches

## Regression Testing

Verify these still work:
- ✅ DocsIndexingStatus component shows correct status
- ✅ Clicking on docs entries still works
- ✅ Adding/removing docs from config updates the list
- ✅ No console errors during any operations
