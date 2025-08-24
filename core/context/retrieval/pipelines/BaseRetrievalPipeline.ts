// @ts-ignore
import nlp from "wink-nlp-utils";

import {
  BranchAndDir,
  Chunk,
  ContextItem,
  ContinueConfig,
  IDE,
  ILLM,
  Tool,
  ToolExtras,
} from "../../../";
import { openedFilesLruCache } from "../../../autocomplete/util/openedFilesLruCache";
import { chunkDocument } from "../../../indexing/chunk/chunk";
import { FullTextSearchCodebaseIndex } from "../../../indexing/FullTextSearchCodebaseIndex";
import { LanceDbIndex } from "../../../indexing/LanceDbIndex";
import { BuiltInToolNames } from "../../../tools/builtIn";
import { callBuiltInTool } from "../../../tools/callTool";
import { globSearchTool } from "../../../tools/definitions/globSearch";
import { grepSearchTool } from "../../../tools/definitions/grepSearch";
import { lsTool } from "../../../tools/definitions/ls";
import { readFileTool } from "../../../tools/definitions/readFile";
import { viewRepoMapTool } from "../../../tools/definitions/viewRepoMap";
import { viewSubdirectoryTool } from "../../../tools/definitions/viewSubdirectory";

const DEFAULT_CHUNK_SIZE = 384;

const AVAILABLE_TOOLS: Tool[] = [
  globSearchTool,
  grepSearchTool,
  lsTool,
  readFileTool,
  viewRepoMapTool,
  viewSubdirectoryTool,
];

export interface RetrievalPipelineOptions {
  llm: ILLM;
  config: ContinueConfig;
  ide: IDE;
  input: string;
  nRetrieve: number;
  nFinal: number;
  tags: BranchAndDir[];
  filterDirectory?: string;
}

export interface RetrievalPipelineRunArguments {
  query: string;
  tags: BranchAndDir[];
  filterDirectory?: string;
  includeEmbeddings: boolean;
}

export interface IRetrievalPipeline {
  run(args: RetrievalPipelineRunArguments): Promise<Chunk[]>;
}

export default class BaseRetrievalPipeline implements IRetrievalPipeline {
  private ftsIndex = new FullTextSearchCodebaseIndex();
  private lanceDbIndex: LanceDbIndex | null = null;
  private lanceDbInitPromise: Promise<void> | null = null;

  constructor(protected readonly options: RetrievalPipelineOptions) {
    void this.initLanceDb();
  }

  protected async initLanceDb() {
    const embedModel = this.options.config.selectedModelByRole.embed;

    if (!embedModel) {
      return;
    }

    this.lanceDbIndex = await LanceDbIndex.create(embedModel, (uri) =>
      this.options.ide.readFile(uri),
    );
  }

  protected async ensureLanceDbInitialized(): Promise<boolean> {
    if (this.lanceDbIndex) {
      return true;
    }

    if (this.lanceDbInitPromise) {
      await this.lanceDbInitPromise;
      return this.lanceDbIndex !== null;
    }

    this.lanceDbInitPromise = this.initLanceDb();
    await this.lanceDbInitPromise;
    this.lanceDbInitPromise = null; // clear after init

    return this.lanceDbIndex !== null;
  }

  private getCleanedTrigrams(
    query: RetrievalPipelineRunArguments["query"],
  ): string[] {
    let text = nlp.string.removeExtraSpaces(query);
    text = nlp.string.stem(text);

    let tokens = nlp.string
      .tokenize(text, true)
      .filter((token: any) => token.tag === "word")
      .map((token: any) => token.value);

    tokens = nlp.tokens.removeWords(tokens);
    tokens = nlp.tokens.setOfWords(tokens);

    const cleanedTokens = [...tokens].join(" ");
    const trigrams = nlp.string.ngram(cleanedTokens, 3);

    return trigrams.map(this.escapeFtsQueryString);
  }

  private escapeFtsQueryString(query: string): string {
    const escapedDoubleQuotes = query.replace(/"/g, '""');
    return `"${escapedDoubleQuotes}"`;
  }

  /**
   * Builds an FTS MATCH string with support for:
   * - File paths and extensions (e.g., path:"styles.css")
   * - Trigrams for semantic search (existing behavior)
   * - Unigram fallback for short queries
   * - Extension-based matching for common file types
   *
   * This ensures CSS files and other assets are properly retrieved
   * even with short queries like "css" or "styles.css".
   */
  private buildFtsMatchString(query: string): string {
    const matchClauses: string[] = [];

    // 1. Extract file-like tokens (e.g., "styles.css", "index.html")
    const fileRegex =
      /[A-Za-z0-9_\-./]+?\.(css|scss|sass|less|js|ts|jsx|tsx|html?|vue|svelte|py|go|java|rs|rb|php|swift|kt|cpp|c|h|hpp|cs|m|mm|sql|xml|yaml|yml|json|md|mdx)\b/gi;
    const fileMatches = query.match(fileRegex) || [];

    for (const file of fileMatches) {
      // Add path-specific search for exact filename
      matchClauses.push(`path:${this.escapeFtsQueryString(file)}`);
    }

    // 2. Check for file extension mentions and add path-based hints
    const extensionKeywords: Record<string, string[]> = {
      css: ["css", "scss", "sass", "less"],
      stylesheet: ["css", "scss", "sass", "less"],
      styles: ["css", "scss", "sass", "less"],
      javascript: ["js", "jsx", "ts", "tsx"],
      typescript: ["ts", "tsx"],
      html: ["html", "htm"],
      python: ["py"],
      golang: ["go"],
      java: ["java"],
      rust: ["rs"],
      ruby: ["rb"],
    };

    const lowerQuery = query.toLowerCase();
    const addedExtensions = new Set<string>();

    for (const [keyword, extensions] of Object.entries(extensionKeywords)) {
      if (lowerQuery.includes(keyword)) {
        for (const ext of extensions) {
          if (!addedExtensions.has(ext)) {
            matchClauses.push(`path:${this.escapeFtsQueryString(ext)}`);
            addedExtensions.add(ext);
          }
        }
      }
    }

    // 3. Generate trigrams for semantic search (existing behavior)
    let text = nlp.string.removeExtraSpaces(query);
    text = nlp.string.stem(text);

    let tokens = nlp.string
      .tokenize(text, true)
      .filter((token: any) => token.tag === "word")
      .map((token: any) => token.value);

    tokens = nlp.tokens.removeWords(tokens);
    tokens = nlp.tokens.setOfWords(tokens);

    const cleanedTokens = [...tokens];

    // Generate trigrams if we have enough tokens
    if (cleanedTokens.length >= 3) {
      const trigramString = cleanedTokens.join(" ");
      const trigrams = nlp.string.ngram(trigramString, 3);
      for (const trigram of trigrams) {
        matchClauses.push(this.escapeFtsQueryString(trigram));
      }
    }

    // 4. Add unigram fallback if we have few trigrams
    // This ensures short queries like "css" still match content
    const trigramCount =
      cleanedTokens.length >= 3 ? Math.max(0, cleanedTokens.length - 2) : 0;

    if (trigramCount < 2 && cleanedTokens.length > 0) {
      // Add individual tokens as fallback
      for (const token of cleanedTokens) {
        if (token.length > 1) {
          // Skip single-character tokens
          matchClauses.push(this.escapeFtsQueryString(token));
        }
      }
    }

    // Return combined MATCH string with OR operator
    return matchClauses.join(" OR ");
  }

  protected async retrieveFts(
    args: RetrievalPipelineRunArguments,
    n: number,
  ): Promise<Chunk[]> {
    if (args.query.trim() === "") {
      return [];
    }

    const matchString = this.buildFtsMatchString(args.query);

    // If no valid match clauses were generated, return empty
    if (!matchString) {
      return [];
    }

    return await this.ftsIndex.retrieve({
      n,
      text: matchString,
      tags: args.tags,
      directory: args.filterDirectory,
    });
  }

  protected async retrieveAndChunkRecentlyEditedFiles(
    n: number,
  ): Promise<Chunk[]> {
    const recentlyEditedFilesSlice = Array.from(
      openedFilesLruCache.keys(),
    ).slice(0, n);

    // If the number of recently edited files is less than the retrieval limit,
    // include additional open files. This is useful in the case where a user
    // has many tabs open and reloads their IDE. They now have 0 recently edited files,
    // but many open tabs that represent what they were working on prior to reload.
    if (recentlyEditedFilesSlice.length < n) {
      const openFiles = await this.options.ide.getOpenFiles();
      recentlyEditedFilesSlice.push(
        ...openFiles.slice(0, n - recentlyEditedFilesSlice.length),
      );
    }

    const chunks: Chunk[] = [];

    for (const filepath of recentlyEditedFilesSlice) {
      const contents = await this.options.ide.readFile(filepath);
      const fileChunks = chunkDocument({
        filepath,
        contents,
        maxChunkSize:
          this.options.config.selectedModelByRole.embed
            ?.maxEmbeddingChunkSize ?? DEFAULT_CHUNK_SIZE,
        digest: filepath,
      });

      for await (const chunk of fileChunks) {
        chunks.push(chunk);
      }
    }

    return chunks.slice(0, n);
  }

  protected async retrieveEmbeddings(
    input: string,
    n: number,
  ): Promise<Chunk[]> {
    const initialized = await this.ensureLanceDbInitialized();

    if (!initialized || !this.lanceDbIndex) {
      console.warn(
        "LanceDB index not available, skipping embeddings retrieval",
      );
      return [];
    }

    return this.lanceDbIndex.retrieve(
      input,
      n,
      this.options.tags,
      this.options.filterDirectory,
    );
  }

  run(args: RetrievalPipelineRunArguments): Promise<Chunk[]> {
    throw new Error("Not implemented");
  }

  protected async retrieveWithTools(input: string): Promise<Chunk[]> {
    const toolSelectionPrompt = `Given the following user input: "${input}"

Available tools:
${AVAILABLE_TOOLS.map((tool) => {
  const requiredParams = tool.function.parameters?.required || [];
  const properties = tool.function.parameters?.properties || {};
  const paramDescriptions = requiredParams
    .map(
      (param: any) => `${param}: ${properties[param]?.description || "string"}`,
    )
    .join(", ");

  return `- ${tool.function.name}: ${tool.function.description}
  Required arguments: ${paramDescriptions || "none"}`;
}).join("\n")}

Determine which tools should be used to answer this query. You should feel free to use multiple tools when they would be helpful for comprehensive results. Respond ONLY a JSON object containing the following and nothing else:
{
  "tools": [
    {
      "name": "<tool_name>",
      "args": { "<required_parameter_name>": "<required_parameter_value>" }
    }
  ]
}`;

    // Get LLM response for tool selection
    const toolSelectionResponse = await this.options.llm.chat(
      [{ role: "user", content: toolSelectionPrompt }],
      new AbortController().signal,
    );

    let toolCalls: { name: string; args: any }[] = [];
    try {
      const responseContent =
        typeof toolSelectionResponse.content === "string"
          ? toolSelectionResponse.content
          : toolSelectionResponse.content
              .map((part) => (part.type === "text" ? part.text : ""))
              .join("");
      const parsed = JSON.parse(responseContent);
      toolCalls = parsed.tools || [];
    } catch (e) {
      // Failed to parse tool selection response - return empty
      return [];
    }

    // Execute tools and collect results
    const allContextItems: ContextItem[] = [];

    const toolExtras: ToolExtras = {
      ide: this.options.ide,
      llm: this.options.llm,
      fetch: fetch,
      tool: grepSearchTool,
      config: this.options.config,
    };

    for (const toolCall of toolCalls) {
      const tool = AVAILABLE_TOOLS.find(
        (t) => t.function.name === toolCall.name,
      )!;

      const args = toolCall.args;
      if (toolCall.name === BuiltInToolNames.GrepSearch) {
        args.splitByFile = true;
      }

      toolExtras.tool = tool;
      const contextItems = await callBuiltInTool(
        toolCall.name,
        args,
        toolExtras,
      );
      allContextItems.push(...contextItems);
    }

    const chunks: Chunk[] = [];

    // Transform ContextItem[] to Chunk[]
    for (let i = 0; i < allContextItems.length; i++) {
      const contextItem = allContextItems[i];
      const filepath = contextItem.uri?.value || contextItem.name || "unknown";
      const cleanedFilepath = filepath.replace(/^file:\/\/\//, "");

      chunks.push({
        content: contextItem.content,
        startLine: -1,
        endLine: -1,
        digest: `file:///${cleanedFilepath}`,
        filepath: `file:///${cleanedFilepath}`,
        index: i,
      });
    }

    return chunks;
  }
}
