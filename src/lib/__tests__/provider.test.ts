import { test, expect, describe, vi, beforeEach, afterEach } from "vitest";
import { MockLanguageModel } from "@/lib/provider";

describe("MockLanguageModel", () => {
  let model: MockLanguageModel;

  beforeEach(() => {
    model = new MockLanguageModel("mock-model");
  });

  test("has correct specification version", () => {
    expect(model.specificationVersion).toBe("v1");
  });

  test("has correct provider name", () => {
    expect(model.provider).toBe("mock");
  });

  test("stores model ID", () => {
    expect(model.modelId).toBe("mock-model");
  });

  test("has default object generation mode set to tool", () => {
    expect(model.defaultObjectGenerationMode).toBe("tool");
  });

  describe("doGenerate", () => {
    test("generates text and tool call for initial message (step 0)", async () => {
      const result = await model.doGenerate({
        prompt: [
          {
            role: "user",
            content: [{ type: "text", text: "Create a counter" }],
          },
        ],
        mode: { type: "regular" },
        inputFormat: "messages",
      } as any);

      expect(result.text).toContain("static response");
      expect(result.toolCalls).toHaveLength(1);
      expect(result.toolCalls[0].toolName).toBe("str_replace_editor");
      expect(result.finishReason).toBe("tool-calls");
      expect(result.usage.promptTokens).toBeGreaterThan(0);
      expect(result.usage.completionTokens).toBeGreaterThan(0);
    });

    test("creates component file at step 1 (one tool message)", async () => {
      const result = await model.doGenerate({
        prompt: [
          {
            role: "user",
            content: [{ type: "text", text: "Create a counter" }],
          },
          {
            role: "assistant",
            content: [{ type: "text", text: "..." }],
          },
          {
            role: "tool",
            content: [{ type: "tool-result", result: "ok" }],
          },
        ],
        mode: { type: "regular" },
        inputFormat: "messages",
      } as any);

      expect(result.text).toContain("Counter");
      expect(result.toolCalls).toHaveLength(1);

      const args = JSON.parse(result.toolCalls[0].args);
      expect(args.command).toBe("create");
      expect(args.path).toContain("Counter.jsx");
    });

    test("generates form component when prompt mentions form", async () => {
      const result = await model.doGenerate({
        prompt: [
          {
            role: "user",
            content: [{ type: "text", text: "Create a contact form" }],
          },
          {
            role: "assistant",
            content: [{ type: "text", text: "..." }],
          },
          {
            role: "tool",
            content: [{ type: "tool-result", result: "ok" }],
          },
        ],
        mode: { type: "regular" },
        inputFormat: "messages",
      } as any);

      const args = JSON.parse(result.toolCalls[0].args);
      expect(args.path).toContain("ContactForm.jsx");
    });

    test("generates card component when prompt mentions card", async () => {
      const result = await model.doGenerate({
        prompt: [
          {
            role: "user",
            content: [{ type: "text", text: "Create a card" }],
          },
          {
            role: "assistant",
            content: [{ type: "text", text: "..." }],
          },
          {
            role: "tool",
            content: [{ type: "tool-result", result: "ok" }],
          },
        ],
        mode: { type: "regular" },
        inputFormat: "messages",
      } as any);

      const args = JSON.parse(result.toolCalls[0].args);
      expect(args.path).toContain("Card.jsx");
    });

    test("returns final summary at step 3+ (stop finish reason)", { timeout: 15000 }, async () => {
      const toolMessages = Array(3)
        .fill(null)
        .map((_, i) => [
          {
            role: "assistant" as const,
            content: [{ type: "text" as const, text: "..." }],
          },
          {
            role: "tool" as const,
            content: [{ type: "tool-result" as const, result: "ok" }],
          },
        ])
        .flat();

      const result = await model.doGenerate({
        prompt: [
          {
            role: "user",
            content: [{ type: "text", text: "Create a counter" }],
          },
          ...toolMessages,
        ],
        mode: { type: "regular" },
        inputFormat: "messages",
      } as any);

      expect(result.text).toContain("created");
      expect(result.toolCalls).toHaveLength(0);
      expect(result.finishReason).toBe("stop");
    });

    test("includes rawCall in response", async () => {
      const prompt = [
        {
          role: "user" as const,
          content: [{ type: "text" as const, text: "test" }],
        },
      ];

      const result = await model.doGenerate({
        prompt,
        mode: { type: "regular" },
        inputFormat: "messages",
        maxTokens: 100,
        temperature: 0.5,
      } as any);

      expect(result.rawCall.rawPrompt).toBe(prompt);
      expect(result.rawCall.rawSettings.maxTokens).toBe(100);
      expect(result.rawCall.rawSettings.temperature).toBe(0.5);
    });
  });

  describe("doStream", () => {
    test("returns a readable stream", async () => {
      const result = await model.doStream({
        prompt: [
          {
            role: "user",
            content: [{ type: "text", text: "Create a counter" }],
          },
        ],
        mode: { type: "regular" },
        inputFormat: "messages",
      } as any);

      expect(result.stream).toBeInstanceOf(ReadableStream);
      expect(result.warnings).toEqual([]);
    });

    test("stream emits text-delta and finish parts", async () => {
      const result = await model.doStream({
        prompt: [
          {
            role: "user",
            content: [{ type: "text", text: "Create a counter" }],
          },
        ],
        mode: { type: "regular" },
        inputFormat: "messages",
      } as any);

      const reader = result.stream.getReader();
      const parts: any[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        parts.push(value);
      }

      const types = parts.map((p) => p.type);
      expect(types).toContain("text-delta");
      expect(types).toContain("tool-call");
      expect(types).toContain("finish");
    });

    test("stream includes rawCall metadata", async () => {
      const prompt = [
        {
          role: "user" as const,
          content: [{ type: "text" as const, text: "test" }],
        },
      ];

      const result = await model.doStream({
        prompt,
        mode: { type: "regular" },
        inputFormat: "messages",
      } as any);

      expect(result.rawCall.rawPrompt).toBe(prompt);
    });
  });

  describe("extractUserPrompt (via doGenerate)", () => {
    test("extracts text from array content", async () => {
      const result = await model.doGenerate({
        prompt: [
          {
            role: "user",
            content: [{ type: "text", text: "Create a form component" }],
          },
          {
            role: "assistant",
            content: [{ type: "text", text: "..." }],
          },
          {
            role: "tool",
            content: [{ type: "tool-result", result: "ok" }],
          },
        ],
        mode: { type: "regular" },
        inputFormat: "messages",
      } as any);

      // Should detect "form" keyword and create ContactForm
      const args = JSON.parse(result.toolCalls[0].args);
      expect(args.path).toContain("ContactForm");
    });

    test("handles missing user message gracefully", async () => {
      const result = await model.doGenerate({
        prompt: [
          {
            role: "assistant",
            content: [{ type: "text", text: "hello" }],
          },
          {
            role: "tool",
            content: [{ type: "tool-result", result: "ok" }],
          },
        ],
        mode: { type: "regular" },
        inputFormat: "messages",
      } as any);

      // Should default to counter component
      const args = JSON.parse(result.toolCalls[0].args);
      expect(args.path).toContain("Counter");
    });
  });
});

describe("getLanguageModel", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test("returns MockLanguageModel when no API key is set", async () => {
    delete process.env.ANTHROPIC_API_KEY;

    const { getLanguageModel } = await import("@/lib/provider");
    const model = getLanguageModel();

    expect(model.provider).toBe("mock");
    expect(model.modelId).toBe("mock-claude-sonnet-4-0");
  });

  test("returns MockLanguageModel when API key is empty", async () => {
    process.env.ANTHROPIC_API_KEY = "";

    const { getLanguageModel } = await import("@/lib/provider");
    const model = getLanguageModel();

    expect(model.provider).toBe("mock");
  });

  test("returns MockLanguageModel when API key is whitespace", async () => {
    process.env.ANTHROPIC_API_KEY = "   ";

    const { getLanguageModel } = await import("@/lib/provider");
    const model = getLanguageModel();

    expect(model.provider).toBe("mock");
  });
});
