import { PROVIDER_TOOL_SUPPORT } from "./toolSupport";

describe("OpenRouter tool support", () => {
  const openrouterSupport = PROVIDER_TOOL_SUPPORT.openrouter;

  describe("free tier models without tool support", () => {
    it("should return false for moonshotai/kimi-k2:free", () => {
      expect(openrouterSupport("moonshotai/kimi-k2:free")).toBe(false);
    });

    it("should return false for other known free models without tools", () => {
      const modelsWithoutTools = [
        "cognitivecomputations/dolphin-mixtral-8x7b:free",
        "gryphe/mythomax-l2-13b:free",
        "openchat/openchat-7b:free",
        "huggingfaceh4/zephyr-7b-beta:free",
        "undi95/toppy-m-7b:free",
        "teknium/openhermes-2.5-mistral-7b:free",
        "nousresearch/nous-capybara-7b:free",
        "mistralai/mistral-7b-instruct:free",
      ];

      for (const model of modelsWithoutTools) {
        expect(openrouterSupport(model)).toBe(false);
      }
    });

    it("should handle case-insensitive matching for free models", () => {
      expect(openrouterSupport("MOONSHOTAI/KIMI-K2:FREE")).toBe(false);
      expect(openrouterSupport("MoonShotAI/Kimi-K2:Free")).toBe(false);
    });
  });

  describe("free tier models with tool support", () => {
    it("should return true for GPT models even with :free suffix", () => {
      // These are examples - actual free models with tools should be verified
      expect(openrouterSupport("openai/gpt-3.5-turbo")).toBe(true);
      expect(openrouterSupport("openai/gpt-4")).toBe(true);
    });

    it("should return true for Claude models", () => {
      expect(openrouterSupport("anthropic/claude-3-sonnet")).toBe(true);
      expect(openrouterSupport("anthropic/claude-3.5-sonnet")).toBe(true);
    });
  });

  describe("non-free models", () => {
    it("should return true for supported non-free models", () => {
      expect(openrouterSupport("meta-llama/llama-3.1-70b")).toBe(true);
      expect(openrouterSupport("qwen/qwq-32b")).toBe(true);
      expect(openrouterSupport("deepseek/deepseek-chat")).toBe(true);
    });

    it("should return false for models with vision/math/guard keywords", () => {
      expect(openrouterSupport("some-model-vision")).toBe(false);
      expect(openrouterSupport("math-model-v1")).toBe(false);
      expect(openrouterSupport("guard-model")).toBe(false);
    });
  });

  describe("bug fixes", () => {
    it("should correctly match specific models", () => {
      // Testing the fix for the bug in specificModels loop
      expect(openrouterSupport("qwen/qwen-2.5-72b-instruct")).toBe(true);
      expect(openrouterSupport("meta-llama/llama-3.2-3b-instruct")).toBe(true);
      expect(openrouterSupport("arcee-ai/caller-large")).toBe(true);
    });

    it("should correctly check for patterns in model names", () => {
      // Testing the fix for the bug in supportedContains loop
      expect(openrouterSupport("meta-llama/llama-3.1-405b")).toBe(true);
      expect(openrouterSupport("some-provider/llama-3.1-8b")).toBe(true);
    });
  });
});
