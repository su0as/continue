# VS Code Extension Testing Guide

## 🚀 Installation Steps

### 1. Install the VSIX Package

**Option A: Using Command Palette**
1. Open VS Code
2. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
3. Type "Extensions: Install from VSIX..."
4. Navigate to: `/Users/krshv/continue-dev/extensions/vscode/build/`
5. Select `continue-1.1.77.vsix`
6. Click "Install"

**Option B: Using Extensions View**
1. Open VS Code
2. Click Extensions icon in sidebar (or press `Cmd+Shift+X`)
3. Click the "..." menu at the top of Extensions panel
4. Select "Install from VSIX..."
5. Navigate to the VSIX file and install

### 2. Reload VS Code
- Press `Cmd+R` (Mac) or `Ctrl+R` (Windows/Linux) to reload the window
- Or use Command Palette: "Developer: Reload Window"

## 🧪 Testing the Docs Feature

### Step 1: Open Continue Panel
- **Method 1:** Click the Continue icon in the Activity Bar (left sidebar)
- **Method 2:** Press `Cmd+Shift+P` → "Continue: Focus Continue View"
- **Method 3:** Use keyboard shortcut (if configured)

### Step 2: Navigate to Docs Section
1. In the Continue panel, look for the configuration/settings area
2. Find the "Docs" section (may be in a settings tab or dropdown)
3. You should see a list of 25 documentation sources

### Step 3: Verify Alphabetical Sorting
The docs should appear in this order:
```
1. Angular Documentation
2. Apache Kafka Documentation  
3. AWS Documentation
4. C++ Reference
5. Django Documentation
6. Docker Docs
7. Flask Documentation
8. GitHub Docs
9. GitLab Documentation
10. https://golang.org/doc/ (no title - sorted by URL)
11. Java Documentation
12. Kubernetes Documentation
13. MDN Web Docs
14. MongoDB Manual
15. Node.js API
16. PHP Manual
17. PostgreSQL Documentation
18. Python Documentation
19. React Documentation
20. Redis Documentation
21. Ruby Documentation
22. Rust Documentation
23. Terraform Documentation
24. TypeScript Handbook
25. Vue.js Guide
```

### Step 4: Test Search Functionality

#### 4.1 Basic Search
- **Test 1:** Type "react" → Should show only "React Documentation"
- **Test 2:** Type "doc" → Should show multiple entries with "doc" in title
- **Test 3:** Type "python" → Should show "Python Documentation"

#### 4.2 Case Insensitivity
- **Test 1:** Type "ANGULAR" → Should show "Angular Documentation"
- **Test 2:** Type "typescript" → Should show "TypeScript Handbook"
- **Test 3:** Type "KuBeRnEtEs" → Should show "Kubernetes Documentation"

#### 4.3 URL Search
- **Test 1:** Type ".org" → Should show all .org domains
- **Test 2:** Type "github" → Should show "GitHub Docs"
- **Test 3:** Type "golang" → Should show the Go documentation entry

#### 4.4 Partial Matches
- **Test 1:** Type "script" → Should match "TypeScript" and "JavaScript" entries
- **Test 2:** Type "sql" → Should match "PostgreSQL" and "MySQL" if present
- **Test 3:** Type "git" → Should match both "GitHub" and "GitLab"

#### 4.5 Clear Functionality
1. Type any search term (e.g., "python")
2. Click the X icon (should appear when text is present)
3. All 25 docs should reappear
4. Search field should be empty

#### 4.6 Edge Cases
- **Empty search:** Clear the field → All docs visible
- **Whitespace:** Type "   " (spaces) → All docs visible
- **No results:** Type "xyz123" → Empty list (no errors)
- **Special chars:** Type "C++" → Should find "C++ Reference"

### Step 5: Performance Testing
1. Rapidly type and delete characters
2. Scroll through the list quickly
3. Clear and re-search multiple times
4. Check for:
   - No lag in search response
   - Smooth scrolling
   - No flickering or UI glitches

### Step 6: Integration Testing
1. Click on a documentation entry → Should open/navigate correctly
2. Check that indexing status indicators still work
3. Verify icons/favicons display properly
4. Ensure no console errors (View → Developer Tools)

## 📸 Screenshots to Capture

1. **Initial State:** All 25 docs in alphabetical order
2. **Search Active:** Searching for "python" with result
3. **Multiple Results:** Searching for "doc" showing multiple matches
4. **Clear Button:** X icon visible when search has text
5. **No Results:** Empty state when searching for non-existent term

## ✅ Acceptance Criteria

- [ ] Docs sorted alphabetically by title (A→Z)
- [ ] Entries without titles sorted by URL
- [ ] Search filters both title and URL
- [ ] Search is case-insensitive
- [ ] Partial matches work correctly
- [ ] Clear button (X) works and is visible when needed
- [ ] No console errors during operation
- [ ] Performance is smooth with 25+ docs
- [ ] DocsIndexingStatus component still functions
- [ ] No regression in existing functionality

## 🐛 Common Issues & Solutions

**Issue:** Extension doesn't appear after installation
- **Solution:** Reload VS Code window (Cmd+R)

**Issue:** Docs section not visible
- **Solution:** Check if Continue panel is properly opened and expanded

**Issue:** Search not working
- **Solution:** Check browser console for errors (F12 → Console tab)

**Issue:** Sorting seems incorrect
- **Solution:** Verify titles in config.json, check for special characters

## 📝 Feedback Template

After testing, provide feedback with:

```markdown
### Test Environment
- VS Code Version: [e.g., 1.85.0]
- OS: [e.g., macOS 14.0]
- Continue Version: 1.1.77

### Test Results
- Alphabetical Sort: ✅/❌
- Search by Title: ✅/❌
- Search by URL: ✅/❌
- Case Insensitive: ✅/❌
- Clear Button: ✅/❌
- Performance: ✅/❌

### Issues Found
[List any issues]

### Screenshots
[Attach screenshots]

### Additional Notes
[Any observations or suggestions]
```

## 🎯 Final Steps

1. Test thoroughly using all test cases above
2. Take screenshots/video of the feature working
3. Note any issues or unexpected behavior
4. Provide feedback on the PR

The packaged extension is ready at:
`/Users/krshv/continue-dev/extensions/vscode/build/continue-1.1.77.vsix`

Good luck with testing! 🚀
