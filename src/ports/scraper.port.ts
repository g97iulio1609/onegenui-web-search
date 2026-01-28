// =============================================================================
// @onegenui/web-search - Scraper Port (Hexagonal Architecture)
// =============================================================================

import type { ScrapeResult, ScrapeOptions } from "../types";

/**
 * Progress callback for scrape operations
 */
export interface ScrapeProgress {
  phase: "starting" | "navigating" | "extracting" | "complete" | "error";
  message: string;
  url: string;
  progress?: number; // 0-100
}

export type ScrapeProgressCallback = (progress: ScrapeProgress) => void;

/**
 * Scrape options with extended configuration
 */
export interface ExtendedScrapeOptions extends ScrapeOptions {
  /** Timeout in milliseconds */
  timeout?: number;
  /** Enable caching */
  cache?: boolean;
  /** Cache TTL in seconds */
  cacheTTL?: number;
  /** Progress callback */
  onProgress?: ScrapeProgressCallback;
  /** Abort signal for cancellation */
  signal?: AbortSignal;
  /** Custom JavaScript to execute */
  jsCode?: string;
  /** CSS selector to wait for */
  waitFor?: string;
  /** Extract media (images, videos) */
  extractMedia?: boolean;
}

/**
 * Scrape result with metadata
 */
export interface ScrapeResponse {
  result: ScrapeResult;
  cached: boolean;
  duration: number;
  source: string;
}

/**
 * Batch scrape result
 */
export interface BatchScrapeResponse {
  results: Map<string, ScrapeResponse>;
  failed: Map<string, Error>;
  totalDuration: number;
}

/**
 * WebScraperPort - Primary port for web scraping operations
 *
 * Implementations:
 * - OneCrawlScraperAdapter (primary)
 * - BrowserServiceScraperAdapter (fallback)
 */
export interface WebScraperPort {
  /**
   * Scrape a single URL
   */
  scrape(url: string, options?: ExtendedScrapeOptions): Promise<ScrapeResponse>;

  /**
   * Scrape multiple URLs in parallel (optimized)
   */
  scrapeMany(
    urls: string[],
    options?: ExtendedScrapeOptions,
  ): Promise<BatchScrapeResponse>;

  /**
   * Check if the scraper service is available
   */
  isAvailable(): Promise<boolean>;

  /**
   * Get service name for identification
   */
  getName(): string;
}

// =============================================================================
// No-op Implementation (for testing/fallback)
// =============================================================================

export const noopWebScraper: WebScraperPort = {
  async scrape(url: string): Promise<ScrapeResponse> {
    return {
      result: { url, title: "", content: "" },
      cached: false,
      duration: 0,
      source: "noop",
    };
  },

  async scrapeMany(urls: string[]): Promise<BatchScrapeResponse> {
    const results = new Map<string, ScrapeResponse>();
    const failed = new Map<string, Error>();

    for (const url of urls) {
      results.set(url, {
        result: { url, title: "", content: "" },
        cached: false,
        duration: 0,
        source: "noop",
      });
    }

    return { results, failed, totalDuration: 0 };
  },

  async isAvailable(): Promise<boolean> {
    return false;
  },

  getName(): string {
    return "noop";
  },
};
