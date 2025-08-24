import { ChatMessage, RangeInFile, SlashCommand } from "../../../index.js";
import { stripImages } from "../../../util/messageContent.js";

const DEFAULT_DOCS_TEMPLATE = `Generate comprehensive documentation for the following code.

# Requirements:
1. **Purpose and Overview**: Explain what the code does at a high level
2. **Parameters/Inputs**: List all parameters with:
   - Name
   - Type (be specific, e.g., string, number, Array<string>)
   - Description
   - Whether it's optional/required
   - Default values if any
3. **Return Values/Outputs**: Describe what the function/class returns
4. **Side Effects**: List any side effects (file I/O, network calls, state mutations)
5. **Exceptions/Errors**: Document potential errors that might be thrown
6. **Usage Examples**: Provide at least 2 practical examples
7. **Dependencies**: List external dependencies if any
8. **Implementation Notes**: Any important implementation details

# Output Format:
Use clean Markdown format with clear sections. Make the documentation suitable for both human readers and automated documentation systems.

# Code to Document:
\`\`\`{{language}}
{{code}}
\`\`\`

{{contextPrompt}}`;

const CONTEXT_PROMPT = `
# Additional Context:
The following context may help you understand the code better:
{{context}}
`;

interface DocGenerationParams {
  style?: "google" | "numpy" | "jsdoc" | "markdown" | "custom";
  format?: "markdown" | "html" | "json";
  includeExamples?: boolean;
  insertDocstring?: boolean;
  outputPath?: string;
}

function getLanguageFromFile(filePath?: string): string {
  if (!filePath) return "typescript";
  
  const ext = filePath.split('.').pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    'ts': 'typescript',
    'tsx': 'typescript',
    'js': 'javascript',
    'jsx': 'javascript',
    'py': 'python',
    'java': 'java',
    'cs': 'csharp',
    'cpp': 'cpp',
    'c': 'c',
    'go': 'go',
    'rs': 'rust',
    'php': 'php',
    'rb': 'ruby',
    'swift': 'swift',
    'kt': 'kotlin',
    'scala': 'scala',
    'r': 'r',
    'dart': 'dart',
    'lua': 'lua',
    'pl': 'perl',
    'sh': 'bash',
    'ps1': 'powershell',
  };
  
  return languageMap[ext || ''] || 'text';
}

function buildDocumentationPrompt(
  code: string,
  language: string,
  params: DocGenerationParams,
  context?: string
): string {
  let template = DEFAULT_DOCS_TEMPLATE;
  
  // Customize based on style
  if (params.style === 'google') {
    template = `Generate documentation following Google's style guide for ${language}.
    
${template}

Follow Google's docstring conventions strictly.`;
  } else if (params.style === 'jsdoc' && (language === 'javascript' || language === 'typescript')) {
    template = `Generate JSDoc documentation for the following ${language} code.

Include:
- @description
- @param with types and descriptions
- @returns with type and description
- @throws for exceptions
- @example for usage examples
- @see for related functions/classes

Code:
\`\`\`${language}
{{code}}
\`\`\`
{{contextPrompt}}`;
  } else if (params.style === 'numpy' && language === 'python') {
    template = `Generate NumPy-style docstring for the following Python code.

Follow the NumPy documentation format:
- Short summary line
- Extended description
- Parameters section with types
- Returns section with types
- Raises section for exceptions
- Examples section with >>> notation
- Notes section if needed

Code:
\`\`\`python
{{code}}
\`\`\`
{{contextPrompt}}`;
  }
  
  // Replace placeholders
  template = template.replace('{{language}}', language);
  template = template.replace('{{code}}', code);
  
  // Add context if available
  if (context) {
    const contextPrompt = CONTEXT_PROMPT.replace('{{context}}', context);
    template = template.replace('{{contextPrompt}}', contextPrompt);
  } else {
    template = template.replace('{{contextPrompt}}', '');
  }
  
  return template;
}

function extractCodeFromSelection(selectedCode: RangeInFile[]): { code: string; language: string; filePath?: string } {
  if (selectedCode.length === 0) {
    return { code: '', language: 'typescript' };
  }
  
  // Use the first selection
  const selection = selectedCode[0];
  const code = selection.content || '';
  const language = getLanguageFromFile(selection.filepath);
  
  return { code, language, filePath: selection.filepath };
}

function formatDocumentationOutput(
  documentation: string,
  format: string,
  language: string
): string {
  if (format === 'json') {
    // Try to extract structured information from the markdown
    const sections: Record<string, any> = {
      overview: '',
      parameters: [],
      returns: '',
      sideEffects: [],
      exceptions: [],
      examples: [],
      dependencies: [],
      notes: ''
    };
    
    // Simple parsing - this could be made more sophisticated
    const lines = documentation.split('\n');
    let currentSection = '';
    
    for (const line of lines) {
      if (line.startsWith('# ') || line.startsWith('## ')) {
        const sectionName = line.replace(/^#+\s*/, '').toLowerCase();
        if (sectionName.includes('purpose') || sectionName.includes('overview')) {
          currentSection = 'overview';
        } else if (sectionName.includes('parameter') || sectionName.includes('input')) {
          currentSection = 'parameters';
        } else if (sectionName.includes('return') || sectionName.includes('output')) {
          currentSection = 'returns';
        } else if (sectionName.includes('side effect')) {
          currentSection = 'sideEffects';
        } else if (sectionName.includes('exception') || sectionName.includes('error')) {
          currentSection = 'exceptions';
        } else if (sectionName.includes('example')) {
          currentSection = 'examples';
        } else if (sectionName.includes('dependenc')) {
          currentSection = 'dependencies';
        } else if (sectionName.includes('note') || sectionName.includes('implementation')) {
          currentSection = 'notes';
        }
      } else if (currentSection && line.trim()) {
        if (Array.isArray(sections[currentSection])) {
          sections[currentSection].push(line.trim());
        } else {
          sections[currentSection] += line + '\n';
        }
      }
    }
    
    return JSON.stringify(sections, null, 2);
  } else if (format === 'html') {
    // Convert markdown to HTML (basic conversion)
    let html = documentation
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^\* (.+)/gim, '<li>$1</li>')
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>');
    
    // Wrap lists
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Documentation</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; padding: 20px; max-width: 900px; margin: 0 auto; }
        h1, h2, h3 { color: #333; }
        code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
        pre { background: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }
        ul { padding-left: 20px; }
    </style>
</head>
<body>
${html}
</body>
</html>`;
  }
  
  // Default: return as markdown
  return documentation;
}

const GenerateDocsCommand: SlashCommand = {
  name: "generate-docs",
  description: "Generate comprehensive documentation for selected code",
  run: async function* ({ ide, llm, input, params, selectedCode, contextItems }) {
    // Check if code is selected
    if (!selectedCode || selectedCode.length === 0) {
      yield "Please select code to generate documentation for.";
      return;
    }
    
    const docParams = (params || {}) as DocGenerationParams;
    const { code, language, filePath } = extractCodeFromSelection(selectedCode);
    
    if (!code) {
      yield "No code content found in selection.";
      return;
    }
    
    // Gather context from contextItems if available
    let contextStr = "";
    if (contextItems && contextItems.length > 0) {
      contextStr = contextItems
        .map(item => `${item.name}: ${item.content}`)
        .join('\n\n');
    }
    
    // Add user input as additional context
    if (input.trim()) {
      contextStr += `\n\nUser notes: ${input}`;
    }
    
    // Build the documentation prompt
    const prompt = buildDocumentationPrompt(
      code,
      language,
      docParams,
      contextStr
    );
    
    yield `Generating ${docParams.style || 'standard'} documentation for ${language} code...\n\n`;
    
    // Generate documentation using the LLM
    let generatedDocs = "";
    const stream = llm.streamChat(
      [{ role: "user", content: prompt }],
      new AbortController().signal
    );
    
    for await (const chunk of stream) {
      if (chunk.choices?.[0]?.delta?.content) {
        const content = chunk.choices[0].delta.content;
        generatedDocs += content;
        yield content;
      }
    }
    
    // Format the output if requested
    if (docParams.format && docParams.format !== 'markdown') {
      yield "\n\n---\nFormatting output as " + docParams.format + "...\n";
      const formatted = formatDocumentationOutput(generatedDocs, docParams.format, language);
      
      // Save to file if outputPath is provided
      if (docParams.outputPath) {
        try {
          await ide.writeFile(docParams.outputPath, formatted);
          yield `\n✅ Documentation saved to: ${docParams.outputPath}`;
        } catch (error) {
          yield `\n❌ Error saving to file: ${error}`;
        }
      }
    }
    
    // If insertDocstring is requested, provide instructions
    if (docParams.insertDocstring) {
      yield "\n\n---\n💡 **To insert as docstring:**\n";
      yield "1. Copy the documentation above\n";
      yield "2. Place cursor at the beginning of your function/class\n";
      yield "3. Use the `/edit` command to insert the docstring\n";
      
      if (language === 'python') {
        yield "\nFor Python, wrap in triple quotes: `\"\"\"docstring\"\"\"`";
      } else if (language === 'javascript' || language === 'typescript') {
        yield "\nFor JavaScript/TypeScript, use JSDoc format: `/** docstring */`";
      }
    }
    
    // Suggest rename opportunities
    yield "\n\n---\n🔄 **Potential Naming Improvements:**\n";
    yield "Based on the documentation, consider these renames for clarity:\n";
    
    // Simple heuristic for rename suggestions
    const variablePattern = /\b([a-z]|tmp|temp|val|data|obj|arr|res|ret)\b/gi;
    const matches = code.match(variablePattern);
    if (matches && matches.length > 0) {
      const uniqueMatches = [...new Set(matches)];
      for (const match of uniqueMatches.slice(0, 3)) {
        yield `- Consider renaming '${match}' to something more descriptive\n`;
      }
    } else {
      yield "- No obvious naming improvements detected\n";
    }
  },
};

export default GenerateDocsCommand;
