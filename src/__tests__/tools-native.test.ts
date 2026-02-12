import { describe, it, expect } from "vitest";
import {
  webSearchTool,
  webScrapeTool,
  webBatchScrapeTool,
  webHealthCheckTool,
  webSearchTools,
} from "../tools.native.js";

// Helper: extract keys from a Zod object schema
function schemaKeys(schema: { shape: Record<string, unknown> }): string[] {
  return Object.keys(schema.shape);
}

describe("tools.native exports", () => {
  // ---------------------------------------------------------------------------
  // webSearchTool
  // ---------------------------------------------------------------------------
  describe("webSearchTool", () => {
    it("has name 'web-search'", () => {
      expect(webSearchTool.name).toBe("web-search");
    });

    it("has domain 'web'", () => {
      expect(webSearchTool.domain).toBe("web");
    });

    it("parameter schema contains expected keys", () => {
      const keys = schemaKeys(webSearchTool.parameters);
      expect(keys).toContain("query");
      expect(keys).toContain("maxResults");
      expect(keys).toContain("engine");
      expect(keys).toContain("type");
      expect(keys).toContain("timeout");
      expect(keys).toHaveLength(5);
    });
  });

  // ---------------------------------------------------------------------------
  // webScrapeTool
  // ---------------------------------------------------------------------------
  describe("webScrapeTool", () => {
    it("has name 'web-scrape'", () => {
      expect(webScrapeTool.name).toBe("web-scrape");
    });

    it("has domain 'web'", () => {
      expect(webScrapeTool.domain).toBe("web");
    });

    it("parameter schema contains expected keys", () => {
      const keys = schemaKeys(webScrapeTool.parameters);
      expect(keys).toContain("url");
      expect(keys).toContain("includeLinks");
      expect(keys).toContain("includeImages");
      expect(keys).toContain("validateImages");
      expect(keys).toContain("preferHDImages");
      expect(keys).toContain("maxContentLength");
      expect(keys).toContain("timeout");
      expect(keys).toHaveLength(7);
    });
  });

  // ---------------------------------------------------------------------------
  // webBatchScrapeTool
  // ---------------------------------------------------------------------------
  describe("webBatchScrapeTool", () => {
    it("has name 'web-batch-scrape'", () => {
      expect(webBatchScrapeTool.name).toBe("web-batch-scrape");
    });

    it("parameter schema contains expected keys", () => {
      const keys = schemaKeys(webBatchScrapeTool.parameters);
      expect(keys).toContain("urls");
      expect(keys).toContain("includeLinks");
      expect(keys).toContain("includeImages");
      expect(keys).toContain("validateImages");
      expect(keys).toContain("timeout");
      expect(keys).toHaveLength(5);
    });
  });

  // ---------------------------------------------------------------------------
  // webHealthCheckTool
  // ---------------------------------------------------------------------------
  describe("webHealthCheckTool", () => {
    it("has name 'web-health-check'", () => {
      expect(webHealthCheckTool.name).toBe("web-health-check");
    });

    it("has an empty parameters schema", () => {
      const keys = schemaKeys(webHealthCheckTool.parameters);
      expect(keys).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // webSearchTools aggregate export
  // ---------------------------------------------------------------------------
  describe("webSearchTools", () => {
    it("has exactly 4 keys", () => {
      expect(Object.keys(webSearchTools)).toHaveLength(4);
    });

    it("includes web-search, web-scrape, web-batch-scrape, web-health-check", () => {
      expect(Object.keys(webSearchTools).sort()).toEqual([
        "web-batch-scrape",
        "web-health-check",
        "web-scrape",
        "web-search",
      ]);
    });

    it("does NOT include web-snapshot", () => {
      expect(webSearchTools).not.toHaveProperty("web-snapshot");
    });
  });
});
