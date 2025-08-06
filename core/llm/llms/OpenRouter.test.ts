import { LLMOptions } from "../../index.js";
import OpenRouter from "./OpenRouter.js";

describe("OpenRouter", () => {
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  describe("free tier models", () => {
    it("should disable tool support for models ending with :free", () => {
      const options: LLMOptions = {
        model: "moonshotai/kimi-k2:free",
        apiKey: "test-key",
      };

      const openRouter = new OpenRouter(options);

      expect(openRouter.capabilities?.tools).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Tool use disabled for model moonshotai/kimi-k2:free as it does not support it. Use non-free variant for full capabilities.",
      );
    });

    it("should handle uppercase :FREE suffix", () => {
      const options: LLMOptions = {
        model: "anthropic/claude-3-haiku:FREE",
        apiKey: "test-key",
      };

      const openRouter = new OpenRouter(options);

      expect(openRouter.capabilities?.tools).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it("should initialize capabilities object if not present", () => {
      const options: LLMOptions = {
        model: "meta-llama/llama-3.2-3b-instruct:free",
        apiKey: "test-key",
      };

      const openRouter = new OpenRouter(options);

      expect(openRouter.capabilities).toBeDefined();
      expect(openRouter.capabilities?.tools).toBe(false);
    });

    it("should preserve other capabilities when disabling tools", () => {
      const options: LLMOptions = {
        model: "test-model:free",
        apiKey: "test-key",
        capabilities: {
          vision: true,
          tools: true,
        },
      };

      const openRouter = new OpenRouter(options);

      expect(openRouter.capabilities?.tools).toBe(false);
      expect(openRouter.capabilities?.vision).toBe(true);
    });
  });

  describe("non-free models", () => {
    it("should not modify tool support for regular models", () => {
      const options: LLMOptions = {
        model: "openai/gpt-4",
        apiKey: "test-key",
        capabilities: {
          tools: true,
        },
      };

      const openRouter = new OpenRouter(options);

      expect(openRouter.capabilities?.tools).toBe(true);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it("should not modify capabilities for models without :free suffix", () => {
      const options: LLMOptions = {
        model: "anthropic/claude-3-5-sonnet",
        apiKey: "test-key",
      };

      const openRouter = new OpenRouter(options);

      // Should be undefined (not explicitly set to false)
      expect(openRouter.capabilities?.tools).toBeUndefined();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it("should handle model names with colons that don't end with :free", () => {
      const options: LLMOptions = {
        model: "provider/model:version:1.0",
        apiKey: "test-key",
        capabilities: {
          tools: true,
        },
      };

      const openRouter = new OpenRouter(options);

      expect(openRouter.capabilities?.tools).toBe(true);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });
});
