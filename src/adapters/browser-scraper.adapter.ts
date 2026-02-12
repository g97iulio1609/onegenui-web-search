// =============================================================================
// Browser Service Scraper Adapter (Fallback)
// =============================================================================

import type {
  WebScraperPort,
  ExtendedScrapeOptions,
  ScrapeResponse,
  BatchScrapeResponse,
} from "../ports/scraper.port";
import { BrowserService, type ActionEmitter } from "../browser-service";
import type { ScrapeOptions } from "../types";

/** BrowserServiceScraperAdapter — fallback for JS-heavy pages. */
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

    if (signal?.aborted) throw new Error("Scrape aborted");

    onProgress?.({
      phase: "starting",
      message: `Scraping ${url} via browser...`,
      url,
    });

    try {
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

      const scrapePromise = this.service.scrape(
        url,
        { includeImages, includeLinks } as ScrapeOptions,
        emit,
      );

      const result = await Promise.race([scrapePromise, timeoutPromise]);

      onProgress?.({
        phase: "complete",
        message: `Scraped ${result.content?.length || 0} characters`,
        url,
      });

      return {
        result,
        cached: false,
        duration: Date.now() - startTime,
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

    for (const url of urls) {
      try {
        results.set(url, await this.scrape(url, options));
      } catch (error) {
        failed.set(
          url,
          error instanceof Error ? error : new Error("Scrape failed"),
        );
      }
    }

    return { results, failed, totalDuration: Date.now() - startTime };
  }

  async isAvailable(): Promise<boolean> {
    if (this.available !== null) return this.available;
    try {
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
