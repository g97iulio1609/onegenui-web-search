import { describe, it, expect } from "vitest";
import {
  parseImageResults,
  parseVideoResults,
  parseSearchResults,
  parseJsonResults,
} from "../result-parsers";
import type { ScrapeResult } from "../../types";

describe("result-parsers", () => {
  describe("parseImageResults", () => {
    it("should parse enhanced images", () => {
      const pageContent: ScrapeResult = {
        url: "https://example.com",
        title: "Test",
        content: "",
        media: {
          images: [
            {
              src: "https://img1.com/cat.jpg",
              alt: "Cat",
              width: 800,
              height: 600,
            },
            {
              src: "https://img2.com/dog.jpg",
              title: "Dog",
              description: "A dog",
            },
          ],
        },
      };

      const results = parseImageResults(pageContent, 10);

      expect(results).toHaveLength(2);
      expect(results[0]!.title).toBe("Cat");
      expect(results[0]!.url).toBe("https://img1.com/cat.jpg");
      expect(results[0]!.media?.dimensions).toEqual({
        width: 800,
        height: 600,
      });
      expect(results[1]!.title).toBe("Dog");
      expect(results[1]!.snippet).toBe("A dog");
    });

    it("should fallback to basic images format", () => {
      const pageContent: ScrapeResult = {
        url: "https://example.com",
        title: "Test",
        content: "",
        images: [{ src: "https://img.com/photo.jpg", alt: "Photo" }],
      };

      const results = parseImageResults(pageContent, 10);

      expect(results).toHaveLength(1);
      expect(results[0]!.title).toBe("Photo");
      expect(results[0]!.url).toBe("https://img.com/photo.jpg");
    });

    it("should respect maxResults limit", () => {
      const pageContent: ScrapeResult = {
        url: "https://example.com",
        title: "Test",
        content: "",
        media: {
          images: Array.from({ length: 20 }, (_, i) => ({
            src: `https://img${i}.com/img.jpg`,
            alt: `Image ${i}`,
          })),
        },
      };

      const results = parseImageResults(pageContent, 5);
      expect(results).toHaveLength(5);
    });
  });

  describe("parseVideoResults", () => {
    it("should parse video results", () => {
      const pageContent: ScrapeResult = {
        url: "https://example.com",
        title: "Test",
        content: "",
        media: {
          videos: [
            {
              src: "https://video.com/v1.mp4",
              embedUrl: "https://embed.com/v1",
              title: "Video 1",
              description: "A video",
              thumbnail: "https://thumb.com/v1.jpg",
              duration: 120,
              provider: "youtube",
            },
          ],
        },
      };

      const results = parseVideoResults(pageContent, 10);

      expect(results).toHaveLength(1);
      expect(results[0]!.title).toBe("Video 1");
      // url uses src first, embedUrl second
      expect(results[0]!.url).toBe("https://video.com/v1.mp4");
      expect(results[0]!.media?.duration).toBe("120");
      expect(results[0]!.media?.provider).toBe("youtube");
    });

    it("should handle missing videos gracefully", () => {
      const pageContent: ScrapeResult = {
        url: "https://example.com",
        title: "Test",
        content: "",
      };

      const results = parseVideoResults(pageContent, 10);
      expect(results).toHaveLength(0);
    });
  });

  describe("parseSearchResults", () => {
    it("should parse DuckDuckGo markdown format", () => {
      const markdown = `
## [Example Website](https://duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com)

This is the description of example website.

## [Another Site](https://duckduckgo.com/l/?uddg=https%3A%2F%2Fanother.com%2Fpage)

Another description here.
      `;

      const results = parseSearchResults(markdown, 10);

      expect(results).toHaveLength(2);
      expect(results[0]!.title).toBe("Example Website");
      expect(results[0]!.url).toBe("https://example.com");
      expect(results[0]!.snippet).toContain("description of example");
      expect(results[1]!.url).toBe("https://another.com/page");
    });

    it("should skip internal DuckDuckGo links", () => {
      const markdown = `
## [Skip This](https://duckduckgo.com/about)

## [Real Result](https://duckduckgo.com/l/?uddg=https%3A%2F%2Freal.com)
      `;

      const results = parseSearchResults(markdown, 10);

      expect(results).toHaveLength(1);
      expect(results[0]!.url).toBe("https://real.com");
    });

    it("should skip duplicate URLs", () => {
      const markdown = `
## [First](https://duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com)

## [Duplicate](https://duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com)
      `;

      const results = parseSearchResults(markdown, 10);
      expect(results).toHaveLength(1);
    });

    it("should respect maxResults limit", () => {
      const markdown = Array.from(
        { length: 20 },
        (_, i) =>
          `## [Result ${i}](https://duckduckgo.com/l/?uddg=https%3A%2F%2Fsite${i}.com)`,
      ).join("\n\n");

      const results = parseSearchResults(markdown, 5);
      expect(results).toHaveLength(5);
    });
  });

  describe("parseJsonResults", () => {
    it("should parse valid JSON array", () => {
      const content = JSON.stringify([
        { title: "Result 1", url: "https://r1.com", snippet: "Snippet 1" },
        { title: "Result 2", url: "https://r2.com", snippet: "Snippet 2" },
      ]);

      const results = parseJsonResults(content, 10);

      expect(results).toHaveLength(2);
      expect(results![0]!.title).toBe("Result 1");
    });

    it("should return null for non-JSON content", () => {
      const results = parseJsonResults("This is not JSON", 10);
      expect(results).toBeNull();
    });

    it("should return null for invalid JSON", () => {
      const results = parseJsonResults("[invalid json", 10);
      expect(results).toBeNull();
    });

    it("should respect maxResults limit", () => {
      const content = JSON.stringify(
        Array.from({ length: 20 }, (_, i) => ({ title: `R${i}` })),
      );

      const results = parseJsonResults(content, 5);
      expect(results).toHaveLength(5);
    });
  });
});
