# Enhanced Documentation Generation Features - Implementation Plan

## Overview
This plan outlines the implementation of comprehensive documentation generation capabilities for Continue, including automatic doc generation, local/external context integration, smart renaming suggestions, and multiple output formats.

## Feature Requirements

### 1. Enhanced Documentation Generation (`/generate-docs`)
- **Command**: `/generate-docs` slash command with file selection dropdown
- **Functionality**: 
  - Show dropdown of current project files when command is invoked
  - Allow multi-file selection from project tree
  - Support specific instructions alongside file selection in chat window
  - Process selected files and generate comprehensive markdown documentation
  - Include: purpose, inputs (with types/descriptions), outputs, side effects, exceptions, usage examples
  - Use customizable prompt templates
  - No assumptions beyond provided code context
- **UI Components**:
  - File selector dropdown with project tree navigation
  - Search/filter bar for quick file finding
  - Checkbox selection for multiple files
  - Preview pane for selected files

### 2. Enhanced Local Project Context Integration
- **Enhanced `@docs` and `@files` providers with dropdown UI**: 
  - Show interactive dropdown when `@docs` or `@files` is typed
  - Display current project's file/folder structure in dropdown
  - Allow folder expansion/collapse in dropdown
  - Multi-select capability for including multiple files/folders
  - Search within current project structure (not just external docs)
  - Index local READMEs, docstrings, markdown files
  - Support `@docs <query>` for project-specific documentation
  - Support `@files <path>` for specific file/folder documentation
- **Dropdown Features**:
  - Real-time search/filter as user types
  - File type indicators (icons for .js, .py, .md, etc.)
  - Recently accessed files section
  - Favorites/pinned files section
- **IDE Command**: "Continue: Docs Force Re-Index" for manual updates

### 3. External Documentation Fetching
- **URL-based docs**: 
  - Users can provide URLs like `https://nextjs.org/docs`
  - Automatically fetch and parse external documentation
  - Add to context for more accurate generation
  - Chain requests to avoid hallucinations
- **Library detection**: 
  - Detect imported libraries (numpy, react, etc.)
  - Auto-fetch relevant API documentation

### 4. Intelligent Renaming Suggestions
- **Post-generation analysis**: 
  - Analyze generated documentation
  - Suggest variable/function/file renames based on descriptions
  - Example: `x` → `user_age_years` if described as "user age in years"
- **Output format**: Editable code diffs
- **Application**: Via `/edit` command

### 5. Docstring Management
- **Insertion**: 
  - Directly insert generated docs as language-appropriate docstrings
  - Python: `"""docstring"""`, JavaScript: `/** JSDoc */`, etc.
- **Updates**: 
  - Diff and merge with existing docstrings
  - Preserve custom additions while updating generated content

### 6. Full Module Documentation
- **Scope**: Entire file or module documentation
- **Content**: 
  - Module overview
  - Dependencies list
  - Architecture diagrams (text-based/mermaid)
  - Class/function relationships

### 7. Output Formatting Options
- **Formats**: Markdown, HTML, Plain text, JSON
- **Destinations**: 
  - New file (e.g., `function_name_docs.md`)
  - Clipboard
  - Inline in chat
- **Smart naming**: Based on documented code element

### 8. Workflow Integration
- **Event triggers**: 
  - On PR review
  - On code changes
  - Via CI/CD hooks
- **Auto-drafting**: Generate/update docs automatically

### 9. Customizable Prompts
- **Location**: `.continue/prompts/generate-docs.prompt`
- **Customization**: 
  - Style guides (Google docstring format, JSDoc, etc.)
  - Company-specific templates
  - Language-specific formats

### 10. Validation and Iteration
- **Post-generation**: 
  - Suggest refinements ("Add example?", "Include edge cases?")
  - Interactive refinement via chat
  - Validation against style guides

### 11. Enhanced Docs Panel UI
- **Sorting Options**:
  - Sort by Name (A-Z, Z-A)
  - Sort by URL
  - Sort by Date Added
  - Sort by Frequency of Use
- **Categorization**:
  - Group docs by technology/framework
  - Create custom categories/folders
  - Drag-and-drop organization
  - Collapsible groups
- **Search and Filter**:
  - Search bar at top of docs panel
  - Filter by name or URL
  - Filter by category/tags
  - Quick search with keyboard shortcuts
- **Visual Improvements**:
  - Favicon display for each doc
  - Compact/expanded view toggle
  - Recently used indicator
  - Quick actions (edit, delete, refresh)

## Implementation Architecture

### Core Components

```typescript
// 1. Enhanced Slash Command with File Selection
interface GenerateDocsCommand extends SlashCommand {
  name: "generate-docs";
  description: "Generate comprehensive documentation for selected code";
  params: {
    files?: string[];  // Selected files from dropdown
    instructions?: string;  // User-provided specific instructions
    style?: "google" | "numpy" | "jsdoc" | "custom";
    format?: "markdown" | "html" | "json";
    includeExamples?: boolean;
    outputPath?: string;
  };
  ui: {
    showFileSelector: boolean;
    allowMultiSelect: boolean;
    showPreview: boolean;
  };
}

// 2. Enhanced Docs Context Provider with UI
interface EnhancedDocsContextProvider extends DocsContextProvider {
  // Add local project indexing
  indexLocalProject(path: string): Promise<void>;
  searchLocalDocs(query: string): Promise<ContextItem[]>;
  
  // Add external URL fetching
  fetchExternalDocs(url: string): Promise<ContextItem[]>;
  parseDocumentationSite(url: string): Promise<DocumentationContent>;
  
  // UI components
  showFileDropdown(): Promise<FileDropdownResult>;
  getProjectFiles(filter?: string): Promise<FileTreeNode[]>;
  getSortedDocs(sortBy: SortOption): Promise<DocItem[]>;
  getCategorizedDocs(): Promise<DocCategory[]>;
}

// UI Types
interface FileDropdownResult {
  selectedFiles: string[];
  selectedFolders: string[];
  instructions?: string;
}

interface FileTreeNode {
  path: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileTreeNode[];
  icon?: string;
  lastModified?: Date;
  size?: number;
}

interface DocItem {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  category?: string;
  tags?: string[];
  dateAdded: Date;
  lastUsed?: Date;
  useCount: number;
}

type SortOption = 'name-asc' | 'name-desc' | 'url' | 'date-added' | 'frequency';

// 3. Documentation Generator Service
interface DocGeneratorService {
  generateDocs(code: string, context: ContextItem[]): Promise<Documentation>;
  suggestRenames(docs: Documentation): RenameS (suggestions[];
  insertDocstring(docs: Documentation, language: string): string;
  formatOutput(docs: Documentation, format: OutputFormat): string;
}

// 4. Local Project Indexer
interface LocalProjectIndexer {
  indexProject(rootPath: string): Promise<ProjectIndex>;
  watchForChanges(rootPath: string): void;
  searchIndex(query: string): Promise<SearchResult[]>;
  extractDocstrings(filePath: string): Promise<DocString[]>;
}
```

### File Structure

```
core/
├── commands/
│   └── slash/
│       ├── GenerateDocsCommand.ts
│       └── ui/
│           └── FileSelector.ts
├── context/
│   └── providers/
│       ├── EnhancedDocsContextProvider.ts
│       ├── LocalProjectContextProvider.ts
│       └── ui/
│           ├── DocsDropdown.ts
│           └── FilesDropdown.ts
├── docs/
│   ├── DocGeneratorService.ts
│   ├── DocstringInserter.ts
│   ├── RenameAnalyzer.ts
│   └── formatters/
│       ├── MarkdownFormatter.ts
│       ├── HTMLFormatter.ts
│       └── JSONFormatter.ts
├── indexing/
│   └── local/
│       ├── LocalProjectIndexer.ts
│       ├── DocstringExtractor.ts
│       └── MarkdownParser.ts
└── prompts/
    └── templates/
        └── generate-docs.hbs

gui/
├── components/
│   ├── DocsPanel/
│   │   ├── DocsPanel.tsx
│   │   ├── DocsList.tsx
│   │   ├── DocsSearch.tsx
│   │   ├── DocsCategories.tsx
│   │   └── DocsSortOptions.tsx
│   ├── FileSelector/
│   │   ├── FileDropdown.tsx
│   │   ├── FileTree.tsx
│   │   ├── FileSearch.tsx
│   │   └── FilePreview.tsx
│   └── ContextProviders/
│       ├── DocsDropdown.tsx
│       └── FilesDropdown.tsx
```

## Implementation Steps

### Phase 1: Core Documentation Generation (Week 1-2)

1. **Create `/generate-docs` slash command**
   ```typescript
   // core/commands/slash/GenerateDocsCommand.ts
   export class GenerateDocsCommand implements SlashCommand {
     async execute(context: CommandContext): Promise<string> {
       const { selectedCode, ideMessenger } = context;
       
       // Get relevant context
       const contextItems = await this.gatherContext(selectedCode);
       
       // Generate documentation
       const docs = await this.generateDocumentation(selectedCode, contextItems);
       
       return this.formatDocumentation(docs);
     }
   }
   ```

2. **Implement prompt templates**
   ```handlebars
   <!-- prompts/templates/generate-docs.hbs -->
   Generate comprehensive documentation for the following code:
   
   ```{{language}}
   {{selectedCode}}
   ```
   
   Include:
   1. Purpose and overview
   2. Parameters/inputs (with types and descriptions)
   3. Return values/outputs
   4. Side effects
   5. Possible exceptions
   6. Usage examples
   
   Context:
   {{#each contextItems}}
   - {{this.content}}
   {{/each}}
   
   Style: {{style}}
   ```

### Phase 2: Local Project Context (Week 2-3)

1. **Enhance DocsContextProvider for local files**
   ```typescript
   class LocalProjectContextProvider extends BaseContextProvider {
     async indexLocalProject(rootPath: string) {
       // Index all markdown, README, docstrings
       const files = await this.findDocumentationFiles(rootPath);
       
       for (const file of files) {
         const content = await this.extractDocumentation(file);
         await this.addToIndex(file, content);
       }
     }
     
     async searchLocalDocs(query: string): Promise<ContextItem[]> {
       // Search indexed local documentation
       const results = await this.searchIndex(query);
       return results.map(r => this.toContextItem(r));
     }
   }
   ```

2. **Add file watcher for auto-reindexing**
   ```typescript
   class FileWatcher {
     watch(patterns: string[]) {
       // Watch for changes in documentation files
       // Trigger reindex on changes
     }
   }
   ```

### Phase 3: External Documentation Integration (Week 3-4)

1. **Implement URL-based documentation fetcher**
   ```typescript
   class ExternalDocsFetcher {
     async fetchDocs(url: string): Promise<DocumentationContent> {
       // Check if it's a known documentation site
       const crawler = this.getCrawlerForUrl(url);
       
       // Fetch and parse documentation
       const pages = await crawler.crawl(url);
       
       // Extract relevant sections
       return this.parseDocumentation(pages);
     }
   }
   ```

2. **Add support for documentation URLs in chat**
   ```typescript
   // Enhanced message processing
   async processMessage(message: string) {
     const urls = this.extractUrls(message);
     
     for (const url of urls) {
       if (this.isDocumentationUrl(url)) {
         const docs = await this.fetchExternalDocs(url);
         this.addToContext(docs);
       }
     }
   }
   ```

### Phase 4: Smart Features (Week 4-5)

1. **Implement rename suggestions**
   ```typescript
   class RenameAnalyzer {
     analyzeDocumentation(docs: Documentation): RenameSuggestion[] {
       const suggestions = [];
       
       // Analyze parameter descriptions
       for (const param of docs.parameters) {
         if (this.isGenericName(param.name)) {
           const suggestedName = this.generateName(param.description);
           suggestions.push({
             original: param.name,
             suggested: suggestedName,
             reason: param.description
           });
         }
       }
       
       return suggestions;
     }
   }
   ```

2. **Add docstring insertion**
   ```typescript
   class DocstringInserter {
     insertDocstring(
       code: string, 
       docs: Documentation, 
       language: Language
     ): string {
       const formatter = this.getFormatter(language);
       const docstring = formatter.format(docs);
       
       return this.insertAtPosition(code, docstring, this.findInsertPosition(code));
     }
   }
   ```

### Phase 5: Output Formatting (Week 5-6)

1. **Implement multiple output formatters**
   ```typescript
   interface OutputFormatter {
     format(docs: Documentation): string;
   }
   
   class MarkdownFormatter implements OutputFormatter {
     format(docs: Documentation): string {
       return `# ${docs.name}
   
   ${docs.description}
   
   ## Parameters
   ${this.formatParameters(docs.parameters)}
   
   ## Returns
   ${docs.returns}
   
   ## Examples
   ${this.formatExamples(docs.examples)}`;
     }
   }
   ```

2. **Add file output options**
   ```typescript
   class OutputHandler {
     async save(docs: Documentation, options: OutputOptions) {
       const formatted = this.format(docs, options.format);
       
       if (options.destination === 'file') {
         const filename = options.filename || `${docs.name}_docs.${options.format}`;
         await this.saveToFile(filename, formatted);
       } else if (options.destination === 'clipboard') {
         await this.copyToClipboard(formatted);
       }
       
       return formatted;
     }
   }
   ```

## Testing Strategy

### Unit Tests
- Test documentation generation for various code types
- Test context gathering from local and external sources
- Test rename suggestion accuracy
- Test docstring insertion for different languages

### Integration Tests
- Test full workflow from code selection to documentation output
- Test indexing and searching local project documentation
- Test external documentation fetching and parsing
- Test format conversions

### E2E Tests
- Test slash command execution in IDE
- Test context provider integration
- Test file output and clipboard operations
- Test interactive refinement flow

## Configuration Schema

```yaml
# config.yaml
docs:
  generation:
    defaultStyle: google
    defaultFormat: markdown
    includeExamples: true
    autoIndex: true
    
  localIndexing:
    enabled: true
    patterns:
      - "**/*.md"
      - "**/README*"
      - "**/*.py"  # For docstrings
      - "**/*.js"  # For JSDoc
    excludePatterns:
      - "**/node_modules/**"
      - "**/.git/**"
      
  externalSources:
    autoFetch: true
    trustedDomains:
      - "*.readthedocs.io"
      - "docs.*.com"
      - "*.github.io"
      
  output:
    defaultDestination: chat
    fileNamingPattern: "{name}_docs.{format}"
    preserveExisting: true
```

## Migration Guide

### For Existing Users
1. The new features are opt-in and won't affect existing workflows
2. Existing `@docs` functionality remains unchanged
3. New local indexing is disabled by default

### Configuration Migration
```typescript
// Automatic migration for existing configs
if (config.docs && !config.docs.generation) {
  config.docs.generation = {
    defaultStyle: 'markdown',
    defaultFormat: 'markdown',
    includeExamples: true
  };
}
```

## Performance Considerations

### Indexing
- Use incremental indexing for large projects
- Cache parsed documentation
- Limit index size with configurable max entries

### External Fetching
- Cache fetched documentation with TTL
- Rate limit external requests
- Use connection pooling for parallel fetches

### Memory Management
- Stream large documentation files
- Paginate search results
- Clear cache on memory pressure

## Security Considerations

### External URLs
- Validate URLs against allowlist
- Sanitize fetched content
- Limit fetch size and timeout

### Local File Access
- Respect .gitignore patterns
- Don't index sensitive files
- Validate file paths

### Generated Content
- Sanitize generated documentation
- Validate rename suggestions
- Prevent injection in docstrings

## Success Metrics

- **Adoption**: % of users using doc generation features
- **Quality**: User feedback on generated documentation accuracy
- **Performance**: Time to generate docs for various code sizes
- **Integration**: % of generated docs committed to repositories
- **Iteration**: Average number of refinements per generation

## Timeline

- **Week 1-2**: Core documentation generation
- **Week 2-3**: Local project context
- **Week 3-4**: External documentation integration
- **Week 4-5**: Smart features (renames, docstrings)
- **Week 5-6**: Output formatting and testing
- **Week 7**: Beta testing and refinement
- **Week 8**: Documentation and release

## Next Steps

1. Review and approve implementation plan
2. Set up development branch
3. Begin Phase 1 implementation
4. Create test documentation projects
5. Gather early user feedback

<citations>
<document>
  <document_type>RULE</document_type>
  <document_id>/Users/krshv/continue-dev/WARP.md</document_id>
</document>
</citations>
