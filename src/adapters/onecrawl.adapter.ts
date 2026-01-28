/**
 * OneCrawl Adapter for @onegenui/web-search
 * Implements WebScraperPort using OneCrawl native TypeScript crawler.
 */

import {
  type WebScraperPort,
  type ExtendedScrapeOptions,
  type ScrapeResponse,
  type BatchScrapeResponse,
} from "../ports/scraper.port";
import {
  createScrapeUseCase,
  type ScrapeUseCaseOptions,
} from "onecrawl";

/**
 * OneCrawlScraperAdapter - WebScraperPort implementation using OneCrawl
 * 
 * This adapter bridges the OneGenUI web-search ports with the OneCrawl
 * TypeScript crawler, providing native scraping without Python dependencies.
 */
export class OneCrawlScraperAdapter implements WebScraperPort {
  private scrapeUseCase = createScrapeUseCase();
  private available: boolean | null = null;

  async scrape(url: string, options?: ExtendedScrapeOptions): Promise<ScrapeResponse> {
    const startTime = Date.now();

    const oneCrawlOptions: ScrapeUseCaseOptions = {
      preferBrowser: options?.extractMedia ?? false,
      fallbackToFetch: true,
      timeout: options?.timeout ?? 30000,
      cache: options?.cache ?? true,
      extractMedia: options?.extractMedia ?? true,
      extractLinks: true,
      extractMetadata: true,
      onProgress: options?.onProgress
        ? (event) => {
            options.onProgress?.({
              phase: event.phase,
              message: event.message,
              url: event.url ?? url,
              progress: event.progress,
            });
          }
        : undefined,
      signal: options?.signal,
    };

    const response = await this.scrapeUseCase.execute(url, oneCrawlOptions);

    return {
      result: {
        url: response.result.url,
        title: response.result.title,
        content: response.result.content,
        links: response.result.links?.map((link) => ({
          href: link.href,
          text: link.text,
        })),
        media: response.result.media
          ? {
              images:
                response.result.media.images?.map((img) => ({
                  src: img.src,
                  alt: img.alt ?? "",
                })) ?? [],
              videos:
                response.result.media.videos?.map((vid) => ({
                  src: vid.src,
                  title: vid.title ?? "",
                })) ?? [],
            }
          : undefined,
      },
      cached: response.cached,
      duration: Date.now() - startTime,
      source: this.getName(),
    };
  }

  async scrapeMany(
    urls: string[],
    options?: ExtendedScrapeOptions
  ): Promise<BatchScrapeResponse> {
    const startTime = Date.now();
    const results = new Map<string, ScrapeResponse>();
    const failed = new Map<string, Error>();

    const resultMap = await this.scrapeUseCase.executeMany(urls, {
      preferBrowser: options?.extractMedia ?? false,
      fallbackToFetch: true,
      timeout: options?.timeout ?? 30000,
      cache: options?.cache ?? true,
      extractMedia: options?.extractMedia ?? true,
      concurrency: 5,
      onProgress: options?.onProgress
        ? (event) => {
            options.onProgress?.({
              phase: event.phase,
              message: event.message,
              url: event.url ?? urls[0] ?? "",
              progress: event.progress,
            });
          }
        : undefined,
      signal: options?.signal,
    });

    for (const [url, scrapeResult] of resultMap) {
      results.set(url, {
        result: {
          url: scrapeResult.url,
          title: scrapeResult.title,
          content: scrapeResult.content,
        },
        cached: false,
        duration: scrapeResult.loadTime ?? 0,
        source: this.getName(),
      });
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
      const scrapers = await this.scrapeUseCase.getAvailableScrapers();
      this.available = scrapers.length > 0;
      return this.available;
    } catch {
      this.available = false;
      return false;
    }
  }

  getName(): string {
    return "onecrawl";
  }
}

/**
 * Create an OneCrawl scraper adapter
 */
export function createOneCrawlScraperAdapter(): WebScraperPort {
  return new OneCrawlScraperAdapter();
}
