import { describe, it, expect } from "vitest";
import { buildSearchUrl, normalizeSearchType } from "../url-builder";

describe("url-builder", () => {
  describe("buildSearchUrl", () => {
    describe("DuckDuckGo", () => {
      it("should build web search URL", () => {
        const url = buildSearchUrl("test query", "duckduckgo", "web");
        expect(url).toContain("duckduckgo.com");
        expect(url).toContain("test%20query");
        expect(url).toContain("ia=web");
      });

      it("should build HTML version for web search", () => {
        const url = buildSearchUrl("test", "duckduckgo", "web", true);
        expect(url).toContain("html.duckduckgo.com/html/");
      });

      it("should build image search URL", () => {
        const url = buildSearchUrl("cat", "duckduckgo", "image");
        expect(url).toContain("iax=images");
        expect(url).toContain("ia=images");
      });

      it("should build video search URL", () => {
        const url = buildSearchUrl("video", "duckduckgo", "video");
        expect(url).toContain("iax=videos");
        expect(url).toContain("ia=videos");
      });

      it("should build news search URL", () => {
        const url = buildSearchUrl("news", "duckduckgo", "news");
        expect(url).toContain("iar=news");
        expect(url).toContain("ia=news");
      });
    });

    describe("Bing", () => {
      it("should build web search URL", () => {
        const url = buildSearchUrl("test", "bing", "web");
        expect(url).toBe("https://www.bing.com/search?q=test");
      });

      it("should build image search URL", () => {
        const url = buildSearchUrl("cat", "bing", "image");
        expect(url).toBe("https://www.bing.com/images/search?q=cat");
      });

      it("should build video search URL", () => {
        const url = buildSearchUrl("video", "bing", "video");
        expect(url).toBe("https://www.bing.com/videos/search?q=video");
      });

      it("should build news search URL", () => {
        const url = buildSearchUrl("news", "bing", "news");
        expect(url).toBe("https://www.bing.com/news/search?q=news");
      });
    });

    describe("Google", () => {
      it("should build web search URL", () => {
        const url = buildSearchUrl("test", "google", "web");
        expect(url).toBe("https://www.google.com/search?q=test");
      });

      it("should build image search URL with tbm=isch", () => {
        const url = buildSearchUrl("cat", "google", "image");
        expect(url).toContain("tbm=isch");
      });

      it("should build video search URL with tbm=vid", () => {
        const url = buildSearchUrl("video", "google", "video");
        expect(url).toContain("tbm=vid");
      });

      it("should build news search URL with tbm=nws", () => {
        const url = buildSearchUrl("news", "google", "news");
        expect(url).toContain("tbm=nws");
      });
    });

    it("should encode query with special characters", () => {
      const url = buildSearchUrl("hello world & test", "duckduckgo", "web");
      expect(url).toContain("hello%20world%20%26%20test");
    });
  });

  describe("normalizeSearchType", () => {
    it("should return web for undefined", () => {
      expect(normalizeSearchType(undefined)).toBe("web");
    });

    it("should normalize image variants", () => {
      expect(normalizeSearchType("image")).toBe("image");
      expect(normalizeSearchType("images")).toBe("image");
      expect(normalizeSearchType("imagecontent")).toBe("image");
      expect(normalizeSearchType("IMAGE")).toBe("image");
    });

    it("should normalize video variants", () => {
      expect(normalizeSearchType("video")).toBe("video");
      expect(normalizeSearchType("videos")).toBe("video");
      expect(normalizeSearchType("VIDEO")).toBe("video");
    });

    it("should recognize news", () => {
      expect(normalizeSearchType("news")).toBe("news");
      expect(normalizeSearchType("NEWS")).toBe("news");
    });

    it("should default to web for unknown types", () => {
      expect(normalizeSearchType("unknown")).toBe("web");
      expect(normalizeSearchType("")).toBe("web");
    });
  });
});
