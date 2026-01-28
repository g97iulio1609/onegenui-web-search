// =============================================================================
// @onegenui/web-search - Browser Service Adapters (Fallback)
// =============================================================================

import type {
  WebSearchPort,
  ExtendedSearchOptions,
  SearchResponse,
} from "../ports/search.port";
import type {
  WebScraperPort,
  ExtendedScrapeOptions,
  ScrapeResponse,
  BatchScrapeResponse,
} from "../ports/scraper.port";
import { BrowserService, type ActionEmitter } from "../browser-service";
import type { SearchOptions, ScrapeOptions } from "../types";

/**
 * BrowserServiceSearchAdapter - WebSearchPort fallback using agent-browser
 *
 * Used when Crawl4AI is not available. Slower but more reliable for
 * JavaScript-heavy pages.
 */
export class BrowserServiceSearchAdapter implements WebSearchPort {
  private service: BrowserService;
  private available: boolean | null = null;

  constructor() {
    this.service = new BrowserService();
  }

  async search(
    query: string,
    options: ExtendedSearchOptions = {},
  ): Promise<SearchResponse> {
    const { maxResults, engine, timeout = 60000, onProgress, signal } = options;

    const startTime = Date.now();

    // Check abort signal
    if (signal?.aborted) {
      throw new Error("Search aborted");
    }

    onProgress?.({
      phase: "starting",
      message: `Searching for "${query}" via browser...`,
    });

    try {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        const id = setTimeout(
          () => reject(new Error("Search timeout")),
          timeout,
        );
        signal?.addEventListener("abort", () => {
          clearTimeout(id);
          reject(new Error("Search aborted"));
        });
      });

      // Create emitter for progress
      const emit: ActionEmitter | undefined = onProgress
        ? (action) => {
            onProgress({
              phase:
                action.status === "complete"
                  ? "complete"
                  : action.status === "error"
                    ? "error"
                    : "searching",
              message: action.message || action.target || "",
            });
          }
        : undefined;

      // Search via browser
      const searchPromise = this.service.search(
        query,
        { maxResults, engine } as SearchOptions,
        emit,
      );

      const results = await Promise.race([searchPromise, timeoutPromise]);
      const duration = Date.now() - startTime;

      onProgress?.({
        phase: "complete",
        message: `Found ${results.results.length} results`,
        results: results.results.length,
      });

      return {
        results,
        cached: false,
        duration,
        source: this.getName(),
      };
    } catch (error) {
      onProgress?.({
        phase: "error",
        message: error instanceof Error ? error.message : "Search failed",
      });
      throw error;
    }
  }

  async isAvailable(): Promise<boolean> {
    if (this.available !== null) return this.available;

    try {
      // Try to run a simple command to check if agent-browser is available
      // This is a lightweight check that doesn't actually navigate
      const result = await this.service.search("test", { maxResults: 1 });
      this.available = result.results.length >= 0; // Even 0 results means it's working
    } catch {
      this.available = false;
    }

    return this.available;
  }

  getName(): string {
    return "browser-service";
  }
}

/**
 * BrowserServiceScraperAdapter - WebScraperPort fallback using agent-browser
 *
 * Used when Crawl4AI is not available. Better for JavaScript-heavy pages.
 */
export class BrowserServiceScraperAdapter implements WebScraperPort {
  private service: BrowserService;
  private available: boolean | null = null;

  constructor() {
    this.service = new BrowserService();
  }

  async scrape(
    url: string,
    options: ExtendedScrapeOptions = {},
  ): Promise<ScrapeResponse> {
    const {
      includeImages,
      includeLinks,
      timeout = 30000,
      onProgress,
      signal,
    } = options;

    const startTime = Date.now();

    // Check abort signal
    if (signal?.aborted) {
      throw new Error("Scrape aborted");
    }

    onProgress?.({
      phase: "starting",
      message: `Scraping ${url} via browser...`,
      url,
    });

    try {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        const id = setTimeout(
          () => reject(new Error("Scrape timeout")),
          timeout,
        );
        signal?.addEventListener("abort", () => {
          clearTimeout(id);
          reject(new Error("Scrape aborted"));
        });
      });

      // Create emitter for progress
      const emit: ActionEmitter | undefined = onProgress
        ? (action) => {
            onProgress({
              phase:
                action.status === "complete"
                  ? "complete"
                  : action.status === "error"
                    ? "error"
                    : action.action === "navigating"
                      ? "navigating"
                      : "extracting",
              message: action.message || action.target || "",
              url: action.url || url,
            });
          }
        : undefined;

      // Scrape via browser
      const scrapePromise = this.service.scrape(
        url,
        { includeImages, includeLinks } as ScrapeOptions,
        emit,
      );

      const result = await Promise.race([scrapePromise, timeoutPromise]);
      const duration = Date.now() - startTime;

      onProgress?.({
        phase: "complete",
        message: `Scraped ${result.content?.length || 0} characters`,
        url,
      });

      return {
        result,
        cached: false,
        duration,
        source: this.getName(),
      };
    } catch (error) {
      onProgress?.({
        phase: "error",
        message: error instanceof Error ? error.message : "Scrape failed",
        url,
      });
      throw error;
    }
  }

  async scrapeMany(
    urls: string[],
    options: ExtendedScrapeOptions = {},
  ): Promise<BatchScrapeResponse> {
    const startTime = Date.now();
    const results = new Map<string, ScrapeResponse>();
    const failed = new Map<string, Error>();

    // BrowserService doesn't support batch, so scrape sequentially
    for (const url of urls) {
      try {
        const response = await this.scrape(url, options);
        results.set(url, response);
      } catch (error) {
        failed.set(
          url,
          error instanceof Error ? error : new Error("Scrape failed"),
        );
      }
    }

    return {
      results,
      failed,
      totalDuration: Date.now() - startTime,
    };
  }

  async isAvailable(): Promise<boolean> {
    if (this.available !== null) return this.available;

    try {
      // Try to scrape example.com to verify the service works
      const result = await this.service.scrape("https://example.com");
      this.available = !!result.content;
    } catch {
      this.available = false;
    }

    return this.available;
  }

  getName(): string {
    return "browser-service";
  }
}
