# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Prerequisites

- Node.js 20.19.0+ (LTS)
- Vite installed globally: `npm i -g vite`
- For JetBrains development: JDK 17

## Common Commands

### Initial Setup
```bash
# Install all dependencies (Unix)
./scripts/install-dependencies.sh

# Install all dependencies (Windows)
.\scripts\install-dependencies.ps1

# Or manually install dependencies for each module
npm install  # root
cd core && npm install
cd ../gui && npm install
cd ../extensions/vscode && npm install
cd ../binary && npm install
```

### Development

#### VS Code Extension
```bash
# Build and package the VS Code extension
cd extensions/vscode
npm run package  # Creates .vsix file in build/

# Run in debug mode
# Use VS Code: Run and Debug > "Launch extension"

# Watch for TypeScript changes
npm run tsc-watch

# Build with sourcemaps
npm run esbuild
```

#### JetBrains Extension
```bash
# Build the plugin
cd extensions/intellij
./gradlew buildPlugin  # Creates .zip in build/distributions/

# Run in debug mode
# Use IntelliJ: Run Continue > Debug
```

#### Core Module
```bash
cd core
npm run tsc:check     # Type checking
npm run build:npm     # Build for npm package
npm run lint          # Run ESLint
npm run lint:fix      # Fix ESLint issues
```

#### GUI Module
```bash
cd gui
npm run dev           # Start Vite dev server
npm run build         # Build for production
npm run tsc:check     # Type checking
```

### Testing

```bash
# Core tests (transitioning from Jest to Vitest)
cd core
npm test              # Run Jest tests
npm run vitest        # Run Vitest tests (preferred for new tests)
npm run test:coverage # Jest with coverage

# GUI tests
cd gui
npm test              # Run Vitest tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage
npm run test:ui       # Interactive UI

# VS Code extension tests
cd extensions/vscode
npm test              # Run Vitest tests

# Run all TypeScript checks from root
npm run tsc:watch     # Watch all modules
```

### Code Quality

```bash
# Format all code (from root)
npm run format

# Check formatting without changes
npm run format:check

# Lint specific modules
cd core && npm run lint
cd ../gui && npm run lint
cd ../extensions/vscode && npm run lint
```

## Architecture Overview

Continue is a monorepo with the following structure:

### Core Components

- **`core/`**: Shared TypeScript functionality for LLM interactions, indexing, autocomplete, and configuration
  - Contains the main business logic used by all extensions
  - Handles communication with LLM providers, code analysis, and context management

- **`gui/`**: React-based UI built with Vite
  - Uses Redux for state management
  - Provides the chat interface, code display, and settings UI
  - Embedded as a webview in both VS Code and JetBrains extensions

- **`extensions/vscode/`**: VS Code extension
  - TypeScript-based extension that integrates with VS Code API
  - Embeds the GUI as a webview panel
  - Handles VS Code-specific features like inline completions and quick fixes

- **`extensions/intellij/`**: JetBrains extension
  - Kotlin/Java-based plugin for IntelliJ platform IDEs
  - Communicates with core via the binary package over stdin/stdout
  - Embeds the GUI in a JCEF (Java Chromium Embedded Framework) panel

- **`binary/`**: Node.js binary packaging for JetBrains
  - Packages the core module as an executable for the JetBrains extension
  - Enables communication between JetBrains (JVM) and TypeScript core

### Supporting Packages

- **`packages/`**: Shared npm packages
  - `config-yaml`: YAML configuration parser
  - `fetch`: Custom fetch implementation with proxy support
  - `llm-info`: LLM model information and metadata
  - `openai-adapters`: OpenAI API compatibility layer
  - `continue-sdk`: SDK for building Continue extensions

### Communication Flow

1. **VS Code Extension**: Direct TypeScript integration
   - VS Code ↔ Extension ↔ Core ↔ GUI (webview)

2. **JetBrains Extension**: Binary bridge pattern
   - IntelliJ ↔ Binary (stdin/stdout) ↔ Core ↔ GUI (JCEF)

## Key Development Notes

### Git Workflow
- Single permanent branch: `main`
- Pre-release tags: `v1.1.x-vscode` trigger preview builds
- Release tags: `v1.0x-vscode` trigger production releases

### Testing Strategy
- The project is transitioning from Jest to Vitest
- New tests should use Vitest (`.vitest.ts` files)
- Legacy tests use Jest (`.test.ts` files in core)

### Programming Principles
- Prefer functional programming paradigms
- Modifying existing classes or creating singletons is acceptable when needed
- Keep functions and files focused and split when they become too large

### Configuration
- Development config location: `extensions/.continue-debug/`
- This keeps development separate from your actual Continue configuration

### Important Files
- `.continue/rules/`: Contains project-specific rules and guidelines
- `CONTRIBUTING.md`: Detailed contribution guidelines
- `scripts/`: Build and installation utilities

## Quick Debugging Tips

### VS Code
- Breakpoints work in `core/` and `extensions/vscode/`
- GUI changes hot-reload automatically with Vite
- Reload host window with Cmd/Ctrl+Shift+P > "Reload Window"

### JetBrains
- Use "Run Continue" configuration in IntelliJ
- GUI changes reload automatically
- Core changes require rebuilding the binary: `cd binary && npm run build -- --os [darwin|linux|win32]`

### Logs
- VS Code: Output panel > "Continue" channel
- JetBrains: Automatically tailed when using "Run Continue"
- Core logs: Check `extensions/.continue-debug/` during development

<citations>
<document>
  <document_type>RULE</document_type>
  <document_id>VhBFu8JwGaIJHZcRpFFgEU</document_id>
</document>
</citations>
