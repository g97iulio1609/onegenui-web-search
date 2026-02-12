import { describe, it, expect } from "vitest";

// ---------------------------------------------------------------------------
// 1. index.native.ts — full entry point
// ---------------------------------------------------------------------------
describe("index.native.ts exports", () => {
  it("exports logger functions (from logger.native)", async () => {
    const mod = await import("../index.native");
    expect(mod.logDebug).toBeTypeOf("function");
    expect(mod.clearLog).toBeTypeOf("function");
  });

  it("exports webSearchTools (from tools.native)", async () => {
    const mod = await import("../index.native");
    expect(mod.webSearchTools).toBeDefined();
    expect(mod.webSearchTool).toBeDefined();
    expect(mod.webScrapeTool).toBeDefined();
    expect(mod.webBatchScrapeTool).toBeDefined();
    expect(mod.webHealthCheckTool).toBeDefined();
  });

  it("exports port utilities", async () => {
    const mod = await import("../index.native");
    expect(mod.noopWebSearch).toBeDefined();
    expect(mod.noopWebScraper).toBeDefined();
    expect(mod.basicContentExtractor).toBeDefined();
  });

  it("exports OneCrawl adapters", async () => {
    const mod = await import("../index.native");
    expect(mod.OneCrawlScraperAdapter).toBeTypeOf("function");
    expect(mod.OneCrawlSearchAdapter).toBeTypeOf("function");
    expect(mod.createOneCrawlScraperAdapter).toBeTypeOf("function");
    expect(mod.createOneCrawlSearchAdapter).toBeTypeOf("function");
  });

  it("exports use-case classes", async () => {
    const mod = await import("../index.native");
    expect(mod.WebSearchUseCase).toBeTypeOf("function");
  });

  it("exports crawler utilities", async () => {
    const mod = await import("../index.native");
    expect(mod.buildSearchUrl).toBeTypeOf("function");
    expect(mod.normalizeSearchType).toBeTypeOf("function");
    expect(mod.parseSearchResults).toBeTypeOf("function");
    expect(mod.parseImageResults).toBeTypeOf("function");
    expect(mod.parseVideoResults).toBeTypeOf("function");
    expect(mod.parseJsonResults).toBeTypeOf("function");
  });

  it("does NOT export BrowserService or agent-browser symbols", async () => {
    const mod = await import("../index.native");
    const keys = Object.keys(mod);
    expect(keys).not.toContain("BrowserService");
    expect(keys).not.toContain("getBrowserService");
    expect(keys).not.toContain("closeBrowserService");
    expect(keys).not.toContain("BrowserServiceSearchAdapter");
    expect(keys).not.toContain("BrowserServiceScraperAdapter");
    expect(keys).not.toContain("webSnapshotTool");
  });
});

// ---------------------------------------------------------------------------
// 2. adapters/index.native.ts
// ---------------------------------------------------------------------------
describe("adapters/index.native.ts exports", () => {
  it("exports OneCrawlScraperAdapter and OneCrawlSearchAdapter", async () => {
    const mod = await import("../adapters/index.native");
    expect(mod.OneCrawlScraperAdapter).toBeTypeOf("function");
    expect(mod.OneCrawlSearchAdapter).toBeTypeOf("function");
    expect(mod.createOneCrawlScraperAdapter).toBeTypeOf("function");
    expect(mod.createOneCrawlSearchAdapter).toBeTypeOf("function");
  });

  it("does NOT export BrowserService adapters", async () => {
    const mod = await import("../adapters/index.native");
    const keys = Object.keys(mod);
    expect(keys).not.toContain("BrowserServiceScraperAdapter");
    expect(keys).not.toContain("BrowserServiceSearchAdapter");
  });
});

// ---------------------------------------------------------------------------
// 3. logger.native.ts
// ---------------------------------------------------------------------------
describe("logger.native.ts exports", () => {
  it("exports logDebug and clearLog functions", async () => {
    const mod = await import("../logger.native");
    expect(mod.logDebug).toBeTypeOf("function");
    expect(mod.clearLog).toBeTypeOf("function");
  });
});

// ---------------------------------------------------------------------------
// 4. tools.native.ts
// ---------------------------------------------------------------------------
describe("tools.native.ts exports", () => {
  it("exports webSearchTools with exactly 4 tools", async () => {
    const mod = await import("../tools.native");
    const toolKeys = Object.keys(mod.webSearchTools);
    expect(toolKeys).toHaveLength(4);
    expect(toolKeys).toContain("web-search");
    expect(toolKeys).toContain("web-scrape");
    expect(toolKeys).toContain("web-batch-scrape");
    expect(toolKeys).toContain("web-health-check");
  });

  it("does NOT include web-snapshot tool", async () => {
    const mod = await import("../tools.native");
    const toolKeys = Object.keys(mod.webSearchTools);
    expect(toolKeys).not.toContain("web-snapshot");
  });
});
