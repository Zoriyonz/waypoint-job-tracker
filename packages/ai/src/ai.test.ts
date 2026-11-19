import { afterEach, describe, expect, it, vi } from "vitest";
import { generateCoverLetter, resolveProvider } from "./index";

const input = {
  company: "Northwind Labs",
  role: "Frontend Engineer",
  resume: "Built React and TypeScript apps. Cut load time by 40%.",
  jobDescription: "Requirements\n- React\n- TypeScript\n- GraphQL",
};

afterEach(() => vi.unstubAllGlobals());

describe("provider selection", () => {
  it("uses the local provider without a key", () => {
    expect(resolveProvider({}).name).toBe("local");
  });
  it("uses anthropic when a key is present", () => {
    expect(resolveProvider({ ANTHROPIC_API_KEY: "test" }).name).toBe("anthropic");
  });
});

describe("generateCoverLetter", () => {
  it("only claims skills found in the resume", async () => {
    const { letter, provider } = await generateCoverLetter(input, {});
    expect(provider).toBe("local");
    expect(letter).toContain("Northwind Labs");
    expect(letter).toContain("React");
    expect(letter).toMatch(/building depth in GraphQL/);
  });

  it("falls back to local when the hosted API fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    const result = await generateCoverLetter(input, { ANTHROPIC_API_KEY: "test" });
    expect(result.provider).toBe("local");
  });

  it("returns hosted text when the API succeeds", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ content: [{ type: "text", text: "Hello from the model" }] }) }),
    );
    const result = await generateCoverLetter(input, { ANTHROPIC_API_KEY: "test" });
    expect(result).toEqual({ letter: "Hello from the model", provider: "anthropic" });
  });
});
