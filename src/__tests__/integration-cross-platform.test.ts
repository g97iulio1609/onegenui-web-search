/**
 * Integration test: verifies cross-platform native exports from
 * OneCrawl, web-search, and providers are correct and interoperable.
 */
import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

// ── OneCrawl native ─────────────────────────────────────────────────────────
import * as onecrawlNative from "../../../../repos/onecrawl/src/index.native";

// ── Web-search native ───────────────────────────────────────────────────────
import * as webSearchNative from "../index.native";

// ── Providers native ────────────────────────────────────────────────────────
import * as providersNative from "../../../providers/src/index.native";

// ─────────────────────────────────────────────────────────────────────────────
// 1. OneCrawl native exports
// ─────────────────────────────────────────────────────────────────────────────
describe("OneCrawl native exports", () => {
  it("exports FetchScraperAdapter", () => {
    expect(onecrawlNative.FetchScraperAdapter).toBeDefined();
    expect(typeof onecrawlNative.FetchScraperAdapter).toBe("function");
  });

  it("exports FetchPoolScraperAdapter", () => {
    expect(onecrawlNative.FetchPoolScraperAdapter).toBeDefined();
    expect(typeof onecrawlNative.FetchPoolScraperAdapter).toBe("function");
  });

  it("exports SearchAdapter", () => {
    expect(onecrawlNative.SearchAdapter).toBeDefined();
    expect(typeof onecrawlNative.SearchAdapter).toBe("function");
  });

  it("exports MemoryStorageAdapter", () => {
    expect(onecrawlNative.MemoryStorageAdapter).toBeDefined();
    expect(typeof onecrawlNative.MemoryStorageAdapter).toBe("function");
  });

  it("does NOT export PlaywrightScraperAdapter", () => {
    expect(
      (onecrawlNative as Record<string, unknown>).PlaywrightScraperAdapter,
    ).toBeUndefined();
  });

  it("does NOT export CDPScraperAdapter", () => {
    expect(
      (onecrawlNative as Record<string, unknown>).CDPScraperAdapter,
    ).toBeUndefined();
  });

  it("does NOT export UndiciScraperAdapter", () => {
    expect(
      (onecrawlNative as Record<string, unknown>).UndiciScraperAdapter,
    ).toBeUndefined();
  });

  it("exports createOneCrawl factory that returns an object with expected methods", () => {
    expect(typeof onecrawlNative.createOneCrawl).toBe("function");
    const instance = onecrawlNative.createOneCrawl();
    expect(typeof instance.scrape).toBe("function");
    expect(typeof instance.scrapeMany).toBe("function");
    expect(typeof instance.search).toBe("function");
    expect(typeof instance.searchMany).toBe("function");
    expect(typeof instance.getAvailableScrapers).toBe("function");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Web-search native exports
// ─────────────────────────────────────────────────────────────────────────────
describe("Web-search native exports", () => {
  it("exports OneCrawlScraperAdapter", () => {
    expect(webSearchNative.OneCrawlScraperAdapter).toBeDefined();
    expect(typeof webSearchNative.OneCrawlScraperAdapter).toBe("function");
  });

  it("exports OneCrawlSearchAdapter", () => {
    expect(webSearchNative.OneCrawlSearchAdapter).toBeDefined();
    expect(typeof webSearchNative.OneCrawlSearchAdapter).toBe("function");
  });

  it("exports webSearchTools with exactly 4 tools", () => {
    expect(webSearchNative.webSearchTools).toBeDefined();
    const toolNames = Object.keys(webSearchNative.webSearchTools);
    expect(toolNames).toHaveLength(4);
    expect(toolNames).toEqual(
      expect.arrayContaining([
        "web-search",
        "web-scrape",
        "web-batch-scrape",
        "web-health-check",
      ]),
    );
  });

  it("does NOT export BrowserServiceScraperAdapter", () => {
    expect(
      (webSearchNative as Record<string, unknown>).BrowserServiceScraperAdapter,
    ).toBeUndefined();
  });

  it("does NOT export BrowserServiceSearchAdapter", () => {
    expect(
      (webSearchNative as Record<string, unknown>).BrowserServiceSearchAdapter,
    ).toBeUndefined();
  });

  it("native index.native.ts source does not re-export BrowserService adapters", () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, "../index.native.ts"),
      "utf-8",
    );
    expect(source).not.toContain("browser-service.adapter");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Providers native exports
// ─────────────────────────────────────────────────────────────────────────────
describe("Providers native exports", () => {
  it("exports registry", () => {
    expect(providersNative.registry).toBeDefined();
    expect(providersNative.registry.languageModel).toBeDefined();
  });

  it("exports createModelForTask as a function", () => {
    expect(typeof providersNative.createModelForTask).toBe("function");
  });

  it("exports CostTracker class", () => {
    expect(providersNative.CostTracker).toBeDefined();
    expect(typeof providersNative.CostTracker).toBe("function");
  });

  it("exports SUPPORTED_MODELS", () => {
    expect(providersNative.SUPPORTED_MODELS).toBeDefined();
    expect(typeof providersNative.SUPPORTED_MODELS).toBe("object");
    expect(Object.keys(providersNative.SUPPORTED_MODELS).length).toBeGreaterThan(0);
  });

  it("does NOT export createGeminiProvider", () => {
    expect(
      (providersNative as Record<string, unknown>).createGeminiProvider,
    ).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Cross-package integration
// ─────────────────────────────────────────────────────────────────────────────
describe("Cross-package integration", () => {
  it("OneCrawl adapters are used by web-search OneCrawlScraperAdapter", () => {
    const adapter = new webSearchNative.OneCrawlScraperAdapter();
    expect(typeof adapter.scrape).toBe("function");
    expect(typeof adapter.scrapeMany).toBe("function");
    expect(typeof adapter.isAvailable).toBe("function");
    expect(adapter.getName()).toBe("onecrawl");
  });

  it("OneCrawl adapters are used by web-search OneCrawlSearchAdapter", () => {
    const adapter = new webSearchNative.OneCrawlSearchAdapter();
    expect(typeof adapter.search).toBe("function");
    expect(typeof adapter.isAvailable).toBe("function");
    expect(adapter.getName()).toBe("onecrawl");
  });

  it("Provider registry from native can resolve language models", () => {
    const { registry } = providersNative;
    expect(typeof registry.languageModel).toBe("function");
    // Verify it can resolve a known provider prefix
    const model = registry.languageModel("openai:gpt-4o");
    expect(model).toBeDefined();
  });
});
