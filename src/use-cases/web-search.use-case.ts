// =============================================================================
// @onegenui/web-search - Web Search Use Case
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
import { CircuitBreaker } from "./circuit-breaker";
import {
  executeWithRetry,
  DEFAULT_RETRY_CONFIG,
  type RetryConfig,
} from "./retry-executor";

export type { RetryConfig } from "./retry-executor";

const DEFAULT_SEARCH_TIMEOUT_MS = 60000;
const DEFAULT_SCRAPE_TIMEOUT_MS = 30000;
const MIN_OPERATION_TIMEOUT_MS = 1000;
const MAX_OPERATION_TIMEOUT_MS = 300000;

export interface HealthStatus {
  name: string;
  available: boolean;
  latency?: number;
  error?: string;
}

/**
 * WebSearchUseCase - Orchestrates search and scraping with fallback chain,
 * circuit breaker, and exponential backoff retry.
 */
export class WebSearchUseCase {
  private searchAdapters: WebSearchPort[];
  private scraperAdapters: WebScraperPort[];
  private retryConfig: RetryConfig;
  private circuit = new CircuitBreaker();

  constructor(
    searchAdapters: WebSearchPort[],
    scraperAdapters: WebScraperPort[],
    retryConfig: Partial<RetryConfig> = {},
  ) {
    if (searchAdapters.length === 0) {
      throw new Error("At least one search adapter is required");
    }
    if (scraperAdapters.length === 0) {
      throw new Error("At least one scraper adapter is required");
    }

    this.searchAdapters = searchAdapters;
    this.scraperAdapters = scraperAdapters;
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  }

  async search(
    query: string,
    options: ExtendedSearchOptions = {},
  ): Promise<SearchResponse> {
    const { onProgress, signal } = options;
    const timeoutMs = normalizeTimeout(options.timeout, DEFAULT_SEARCH_TIMEOUT_MS);
    let lastError: Error | null = null;

    for (const adapter of this.searchAdapters) {
      const name = adapter.getName();
      if (this.circuit.isOpen(name)) {
        onProgress?.({ phase: "starting", message: `Skipping ${name} (circuit open)` });
        continue;
      }

      try {
        const response = await executeWithRetry(
          (sig) =>
            adapter.search(query, {
              ...options,
              signal: sig,
              onProgress: (p) => onProgress?.({ ...p, message: `[${name}] ${p.message}` }),
            }),
          name,
          this.retryConfig,
          { timeoutMs, signal },
        );
        this.circuit.reset(name);
        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.circuit.recordFailure(name);
        onProgress?.({ phase: "error", message: `${name} failed: ${lastError.message}, trying fallback...` });
      }
    }

    throw lastError || new Error("All search adapters failed");
  }

  async scrape(
    url: string,
    options: ExtendedScrapeOptions = {},
  ): Promise<ScrapeResponse> {
    const { onProgress, signal } = options;
    const timeoutMs = normalizeTimeout(options.timeout, DEFAULT_SCRAPE_TIMEOUT_MS);
    let lastError: Error | null = null;

    for (const adapter of this.scraperAdapters) {
      const name = adapter.getName();
      if (this.circuit.isOpen(name)) {
        onProgress?.({ phase: "starting", message: `Skipping ${name} (circuit open)`, url });
        continue;
      }

      try {
        const response = await executeWithRetry(
          (sig) =>
            adapter.scrape(url, {
              ...options,
              signal: sig,
              onProgress: (p) => onProgress?.({ ...p, message: `[${name}] ${p.message}` }),
            }),
          name,
          this.retryConfig,
          { timeoutMs, signal },
        );
        this.circuit.reset(name);
        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.circuit.recordFailure(name);
        onProgress?.({ phase: "error", message: `${name} failed: ${lastError.message}, trying fallback...`, url });
      }
    }

    throw lastError || new Error("All scraper adapters failed");
  }

  async scrapeMany(
    urls: string[],
    options: ExtendedScrapeOptions = {},
  ): Promise<BatchScrapeResponse> {
    const { onProgress } = options;
    const results = new Map<string, ScrapeResponse>();
    const failed = new Map<string, Error>();
    const startTime = Date.now();

    const primary = this.scraperAdapters.find(
      (a) => !this.circuit.isOpen(a.getName()),
    );

    if (primary) {
      const name = primary.getName();
      try {
        const batch = await primary.scrapeMany(urls, {
          ...options,
          onProgress: (p) => onProgress?.({ ...p, message: `[${name}] ${p.message}` }),
        });
        for (const [u, r] of batch.results) results.set(u, r);

        const failedUrls = Array.from(batch.failed.keys());
        if (failedUrls.length > 0) {
          onProgress?.({
            phase: "starting",
            message: `Retrying ${failedUrls.length} failed URLs with fallback...`,
            url: failedUrls[0]!,
          });
          for (const u of failedUrls) {
            try {
              results.set(u, await this.scrape(u, options));
            } catch (e) {
              failed.set(u, e instanceof Error ? e : new Error(String(e)));
            }
          }
        }
        return { results, failed, totalDuration: Date.now() - startTime };
      } catch (error) {
        onProgress?.({
          phase: "error",
          message: `Batch scrape failed: ${error instanceof Error ? error.message : String(error)}`,
          url: urls[0]!,
        });
      }
    }

    for (const u of urls) {
      try {
        results.set(u, await this.scrape(u, options));
      } catch (e) {
        failed.set(u, e instanceof Error ? e : new Error(String(e)));
      }
    }
    return { results, failed, totalDuration: Date.now() - startTime };
  }

  async healthCheck(): Promise<{ search: HealthStatus[]; scraper: HealthStatus[] }> {
    const check = async (
      adapter: WebSearchPort | WebScraperPort,
    ): Promise<HealthStatus> => {
      const name = adapter.getName();
      const start = Date.now();
      try {
        return { name, available: await adapter.isAvailable(), latency: Date.now() - start };
      } catch (error) {
        return {
          name,
          available: false,
          latency: Date.now() - start,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    };

    const [search, scraper] = await Promise.all([
      Promise.all(this.searchAdapters.map(check)),
      Promise.all(this.scraperAdapters.map(check)),
    ]);
    return { search, scraper };
  }
}

function normalizeTimeout(
  timeoutMs: number | undefined,
  fallback: number,
): number {
  if (typeof timeoutMs !== "number" || !Number.isFinite(timeoutMs)) return fallback;
  return Math.min(MAX_OPERATION_TIMEOUT_MS, Math.max(MIN_OPERATION_TIMEOUT_MS, timeoutMs));
}
