# Debug Mode Testing Instructions

## Option 1: Using VS Code Debug Mode (Recommended)

This will run the extension with live changes without needing to package it.

### Steps:

1. **Open the Continue repository in VS Code:**
   ```bash
   code /Users/krshv/continue-dev
   ```

2. **Build the necessary components:**
   ```bash
   # In terminal 1 - Build GUI
   cd /Users/krshv/continue-dev/gui
   npm run build
   
   # Copy GUI to extension
   cp -r dist/* ../extensions/vscode/gui/
   
   # In terminal 2 - Build extension
   cd /Users/krshv/continue-dev/extensions/vscode
   npm run esbuild
   ```

3. **Run in Debug Mode:**
   - Open VS Code with the Continue repository
   - Press `F5` or go to Run → Start Debugging
   - Select "Launch extension" from the dropdown
   - A new VS Code window will open with the extension loaded

4. **Test the Feature:**
   - In the new VS Code window, open the Continue panel
   - Navigate to the Docs section
   - The search and alphabetical sorting should now work

## Option 2: Manual Rebuild and Reinstall

If debug mode doesn't work, let's do a clean rebuild:

```bash
# 1. Clean build directories
cd /Users/krshv/continue-dev
rm -rf gui/dist
rm -rf extensions/vscode/gui/*
rm -rf extensions/vscode/build/*

# 2. Rebuild GUI
cd gui
npm run build

# 3. Copy to VSCode extension
cp -r dist/* ../extensions/vscode/gui/

# 4. Package extension
cd ../extensions/vscode
npm run package

# 5. Uninstall old version in VS Code
# - Open VS Code
# - Go to Extensions
# - Find Continue and uninstall it
# - Restart VS Code

# 6. Install new version
# - Install from VSIX: /Users/krshv/continue-dev/extensions/vscode/build/continue-1.1.77.vsix
# - Restart VS Code
```

## Option 3: Direct GUI Testing

To verify the GUI changes are working independently:

```bash
# Start the GUI dev server
cd /Users/krshv/continue-dev/gui
npm run dev
```

Then open http://localhost:5173 in your browser and check if the docs section shows the search and sorting features.

## Troubleshooting

### If the feature still doesn't work:

1. **Check console errors:**
   - In VS Code: Help → Toggle Developer Tools → Console tab
   - Look for any JavaScript errors

2. **Verify the config is loaded:**
   - Check if `/Users/krshv/continue-dev/extensions/.continue-debug/config.json` exists
   - Ensure it has the docs array with multiple entries

3. **Check the component is rendering:**
   - In Developer Tools, go to Elements/Inspector
   - Search for "Search docs by name" in the HTML
   - If not found, the component isn't rendering

4. **Verify the build output:**
   ```bash
   # Check if DocsSection is in the built files
   grep -r "Search docs by name" /Users/krshv/continue-dev/extensions/vscode/gui/
   ```

### Common Issues:

- **Cache issues:** Clear VS Code cache and restart
- **Old extension version:** Make sure to completely uninstall the old version
- **Build not updated:** The GUI build might not have been copied to the extension

## Expected Result

When working correctly, you should see:
1. A search input field at the top of the Docs section
2. Docs sorted alphabetically by title (A-Z)
3. Search filtering working for both title and URL
4. Clear button (X) appearing when text is entered
