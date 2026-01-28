// =============================================================================
// @onegenui/web-search - Crawl4AI Scraper Adapter
// =============================================================================

import type {
  WebScraperPort,
  ExtendedScrapeOptions,
  ScrapeResponse,
  BatchScrapeResponse,
} from "../ports/scraper.port";
import { Crawl4AIService, type Crawl4AIOptions } from "../crawl4ai-service";
import type { ScrapeResult, ScrapeOptions } from "../types";

/**
 * LRU Cache for scrape results
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class LRUCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;
  private ttl: number;

  constructor(maxSize = 200, ttlMs = 30 * 60 * 1000) {
    this.maxSize = maxSize;
    this.ttl = ttlMs;
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.data;
  }

  set(key: string, data: T): void {
    if (this.cache.size >= this.maxSize) {
      // Delete oldest (first) entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }
}

/**
 * Crawl4AIScraperAdapter - WebScraperPort implementation using Crawl4AI
 *
 * Features:
 * - URL-level LRU caching with configurable TTL
 * - Batch scraping with single Python process
 * - Progress streaming
 * - Timeout support
 * - Graceful degradation with partial results
 */
export class Crawl4AIScraperAdapter implements WebScraperPort {
  private service: Crawl4AIService;
  private cache: LRUCache<ScrapeResult>;
  private available: boolean | null = null;

  constructor(cacheSize = 200, cacheTTL = 30 * 60 * 1000) {
    this.service = new Crawl4AIService();
    this.cache = new LRUCache(cacheSize, cacheTTL);
  }

  async scrape(
    url: string,
    options: ExtendedScrapeOptions = {},
  ): Promise<ScrapeResponse> {
    const {
      includeImages,
      includeLinks,
      maxContentLength,
      cache: useCache = true,
      timeout = 30000,
      onProgress,
      signal,
      jsCode,
      waitFor,
      extractMedia = true,
    } = options;

    const startTime = Date.now();

    // Check cache first
    const cacheKey = `${url}|${extractMedia}|${jsCode || ""}|${waitFor || ""}`;
    if (useCache) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        onProgress?.({
          phase: "complete",
          message: "Results from cache",
          url,
        });
        return {
          result: cached,
          cached: true,
          duration: Date.now() - startTime,
          source: this.getName(),
        };
      }
    }

    // Check abort signal
    if (signal?.aborted) {
      throw new Error("Scrape aborted");
    }

    onProgress?.({ phase: "starting", message: `Scraping ${url}...`, url });

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

      // Map options to Crawl4AI format
      const crawl4aiOptions: ScrapeOptions & Crawl4AIOptions = {
        includeImages,
        includeLinks,
        maxContentLength,
        js: jsCode,
        waitFor,
        cache: false, // We handle caching ourselves
        noMedia: !extractMedia,
      };

      // Create scrape promise with progress forwarding
      const scrapePromise = this.service.scrape(
        url,
        crawl4aiOptions,
        onProgress
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
                message: action.message || "",
                url: action.url || url,
              });
            }
          : undefined,
      );

      const results = await Promise.race([scrapePromise, timeoutPromise]);
      const duration = Date.now() - startTime;

      if (!results || results.length === 0) {
        throw new Error("No content extracted");
      }

      const result = results[0]!;

      // Cache the results
      if (useCache) {
        this.cache.set(cacheKey, result);
      }

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
    const {
      includeImages,
      includeLinks,
      maxContentLength,
      cache: useCache = true,
      timeout = 120000,
      onProgress,
      signal,
      jsCode,
      waitFor,
      extractMedia = true,
    } = options;

    const startTime = Date.now();
    const results = new Map<string, ScrapeResponse>();
    const failed = new Map<string, Error>();

    // Check cache first for all URLs
    const urlsToScrape: string[] = [];
    for (const url of urls) {
      const cacheKey = `${url}|${extractMedia}|${jsCode || ""}|${waitFor || ""}`;
      if (useCache) {
        const cached = this.cache.get(cacheKey);
        if (cached) {
          results.set(url, {
            result: cached,
            cached: true,
            duration: 0,
            source: this.getName(),
          });
          continue;
        }
      }
      urlsToScrape.push(url);
    }

    // Check abort signal
    if (signal?.aborted) {
      throw new Error("Batch scrape aborted");
    }

    // If all cached, return immediately
    if (urlsToScrape.length === 0) {
      return {
        results,
        failed,
        totalDuration: Date.now() - startTime,
      };
    }

    onProgress?.({
      phase: "starting",
      message: `Batch scraping ${urlsToScrape.length} URLs...`,
      url: urlsToScrape[0]!,
    });

    try {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        const id = setTimeout(
          () => reject(new Error("Batch scrape timeout")),
          timeout,
        );
        signal?.addEventListener("abort", () => {
          clearTimeout(id);
          reject(new Error("Batch scrape aborted"));
        });
      });

      // Map options to Crawl4AI format
      const crawl4aiOptions: ScrapeOptions & Crawl4AIOptions = {
        includeImages,
        includeLinks,
        maxContentLength,
        js: jsCode,
        waitFor,
        cache: false, // We handle caching ourselves
        noMedia: !extractMedia,
      };

      // Batch scrape with single Python process
      const scrapePromise = this.service.scrape(
        urlsToScrape,
        crawl4aiOptions,
        onProgress
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
                message: action.message || "",
                url: action.url || urlsToScrape[0]!,
              });
            }
          : undefined,
      );

      const scrapeResults = await Promise.race([scrapePromise, timeoutPromise]);
      const scrapeTime = Date.now() - startTime;

      // Process results
      for (let i = 0; i < urlsToScrape.length; i++) {
        const url = urlsToScrape[i]!;
        const result = scrapeResults[i];

        if (result && result.content) {
          const cacheKey = `${url}|${extractMedia}|${jsCode || ""}|${waitFor || ""}`;
          if (useCache) {
            this.cache.set(cacheKey, result);
          }

          results.set(url, {
            result,
            cached: false,
            duration: scrapeTime / urlsToScrape.length, // Estimate per-URL time
            source: this.getName(),
          });
        } else {
          failed.set(url, new Error("No content extracted"));
        }
      }

      onProgress?.({
        phase: "complete",
        message: `Batch complete: ${results.size} success, ${failed.size} failed`,
        url: urlsToScrape[0]!,
      });

      return {
        results,
        failed,
        totalDuration: Date.now() - startTime,
      };
    } catch (error) {
      // On error, mark all URLs as failed
      for (const url of urlsToScrape) {
        if (!results.has(url)) {
          failed.set(
            url,
            error instanceof Error ? error : new Error("Batch scrape failed"),
          );
        }
      }

      onProgress?.({
        phase: "error",
        message: error instanceof Error ? error.message : "Batch scrape failed",
        url: urlsToScrape[0]!,
      });

      return {
        results,
        failed,
        totalDuration: Date.now() - startTime,
      };
    }
  }

  async isAvailable(): Promise<boolean> {
    if (this.available !== null) return this.available;

    try {
      // Try a simple scrape to verify the service works
      const result = await this.service.scrape("https://example.com", {
        noMedia: true,
      });
      this.available = result.length > 0 && !!result[0]?.content;
    } catch {
      this.available = false;
    }

    return this.available;
  }

  getName(): string {
    return "crawl4ai";
  }

  /**
   * Clear the scrape cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}
