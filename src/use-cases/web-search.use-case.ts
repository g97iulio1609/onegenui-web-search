// =============================================================================
// @onegenui/web-search - Web Search Use Case
// =============================================================================

import type {
  WebSearchPort,
  ExtendedSearchOptions,
  SearchResponse,
  SearchProgress,
} from "../ports/search.port";
import type {
  WebScraperPort,
  ExtendedScrapeOptions,
  ScrapeResponse,
  BatchScrapeResponse,
  ScrapeProgress,
} from "../ports/scraper.port";

/**
 * Retry configuration
 */
export interface RetryConfig {
  /** Maximum number of retries */
  maxRetries: number;
  /** Initial delay in ms */
  initialDelay: number;
  /** Multiplier for exponential backoff */
  backoffMultiplier: number;
  /** Maximum delay in ms */
  maxDelay: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  backoffMultiplier: 2,
  maxDelay: 10000,
};

/**
 * Health check result
 */
export interface HealthStatus {
  name: string;
  available: boolean;
  latency?: number;
  error?: string;
}

/**
 * WebSearchUseCase - Orchestrates search and scraping with fallback chain
 *
 * Features:
 * - Primary/fallback adapter chain
 * - Exponential backoff retry
 * - Circuit breaker pattern
 * - Partial failure handling
 * - Health checks
 */
export class WebSearchUseCase {
  private searchAdapters: WebSearchPort[];
  private scraperAdapters: WebScraperPort[];
  private retryConfig: RetryConfig;

  // Circuit breaker state
  private circuitState = new Map<
    string,
    { failures: number; lastFailure: number; open: boolean }
  >();
  private circuitThreshold = 5;
  private circuitResetTime = 60000; // 1 minute

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

  /**
   * Search with fallback chain
   */
  async search(
    query: string,
    options: ExtendedSearchOptions = {},
  ): Promise<SearchResponse> {
    const { onProgress } = options;
    let lastError: Error | null = null;

    for (const adapter of this.searchAdapters) {
      const name = adapter.getName();

      // Check circuit breaker
      if (this.isCircuitOpen(name)) {
        onProgress?.({
          phase: "starting",
          message: `Skipping ${name} (circuit open)`,
        });
        continue;
      }

      try {
        const response = await this.executeWithRetry(
          () =>
            adapter.search(query, {
              ...options,
              onProgress: (progress) => {
                onProgress?.({
                  ...progress,
                  message: `[${name}] ${progress.message}`,
                });
              },
            }),
          name,
        );

        // Success - reset circuit
        this.resetCircuit(name);
        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.recordFailure(name);

        onProgress?.({
          phase: "error",
          message: `${name} failed: ${lastError.message}, trying fallback...`,
        });
      }
    }

    throw lastError || new Error("All search adapters failed");
  }

  /**
   * Scrape single URL with fallback chain
   */
  async scrape(
    url: string,
    options: ExtendedScrapeOptions = {},
  ): Promise<ScrapeResponse> {
    const { onProgress } = options;
    let lastError: Error | null = null;

    for (const adapter of this.scraperAdapters) {
      const name = adapter.getName();

      // Check circuit breaker
      if (this.isCircuitOpen(name)) {
        onProgress?.({
          phase: "starting",
          message: `Skipping ${name} (circuit open)`,
          url,
        });
        continue;
      }

      try {
        const response = await this.executeWithRetry(
          () =>
            adapter.scrape(url, {
              ...options,
              onProgress: (progress) => {
                onProgress?.({
                  ...progress,
                  message: `[${name}] ${progress.message}`,
                });
              },
            }),
          name,
        );

        // Success - reset circuit
        this.resetCircuit(name);
        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.recordFailure(name);

        onProgress?.({
          phase: "error",
          message: `${name} failed: ${lastError.message}, trying fallback...`,
          url,
        });
      }
    }

    throw lastError || new Error("All scraper adapters failed");
  }

  /**
   * Scrape multiple URLs with fallback and partial results
   */
  async scrapeMany(
    urls: string[],
    options: ExtendedScrapeOptions = {},
  ): Promise<BatchScrapeResponse> {
    const { onProgress } = options;
    const results = new Map<string, ScrapeResponse>();
    const failed = new Map<string, Error>();
    const startTime = Date.now();

    // Try primary adapter first for batch (more efficient)
    const primaryAdapter = this.scraperAdapters.find(
      (a) => !this.isCircuitOpen(a.getName()),
    );

    if (primaryAdapter) {
      const name = primaryAdapter.getName();
      try {
        const batchResult = await primaryAdapter.scrapeMany(urls, {
          ...options,
          onProgress: (progress) => {
            onProgress?.({
              ...progress,
              message: `[${name}] ${progress.message}`,
            });
          },
        });

        // Merge results
        for (const [url, response] of batchResult.results) {
          results.set(url, response);
        }

        // Track failed URLs for retry
        const failedUrls = Array.from(batchResult.failed.keys());
        if (failedUrls.length > 0) {
          onProgress?.({
            phase: "starting",
            message: `Retrying ${failedUrls.length} failed URLs with fallback...`,
            url: failedUrls[0]!,
          });

          // Retry failed URLs with fallback adapters
          for (const url of failedUrls) {
            try {
              const response = await this.scrape(url, options);
              results.set(url, response);
            } catch (error) {
              failed.set(
                url,
                error instanceof Error ? error : new Error(String(error)),
              );
            }
          }
        }

        return { results, failed, totalDuration: Date.now() - startTime };
      } catch (error) {
        // Primary batch failed, fall through to individual scraping
        onProgress?.({
          phase: "error",
          message: `Batch scrape failed: ${error instanceof Error ? error.message : String(error)}`,
          url: urls[0]!,
        });
      }
    }

    // Fallback: scrape individually with fallback chain
    for (const url of urls) {
      try {
        const response = await this.scrape(url, options);
        results.set(url, response);
      } catch (error) {
        failed.set(
          url,
          error instanceof Error ? error : new Error(String(error)),
        );
      }
    }

    return { results, failed, totalDuration: Date.now() - startTime };
  }

  /**
   * Check health of all adapters
   */
  async healthCheck(): Promise<{
    search: HealthStatus[];
    scraper: HealthStatus[];
  }> {
    const checkAdapter = async (
      adapter: WebSearchPort | WebScraperPort,
    ): Promise<HealthStatus> => {
      const name = adapter.getName();
      const start = Date.now();

      try {
        const available = await adapter.isAvailable();
        return {
          name,
          available,
          latency: Date.now() - start,
        };
      } catch (error) {
        return {
          name,
          available: false,
          latency: Date.now() - start,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    };

    const [searchHealth, scraperHealth] = await Promise.all([
      Promise.all(this.searchAdapters.map(checkAdapter)),
      Promise.all(this.scraperAdapters.map(checkAdapter)),
    ]);

    return {
      search: searchHealth,
      scraper: scraperHealth,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Private Methods
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Execute with exponential backoff retry
   */
  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    adapterName: string,
  ): Promise<T> {
    const { maxRetries, initialDelay, backoffMultiplier, maxDelay } =
      this.retryConfig;
    let lastError: Error | null = null;
    let delay = initialDelay;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < maxRetries) {
          console.log(
            `[WebSearchUseCase] ${adapterName} attempt ${attempt + 1} failed, retrying in ${delay}ms...`,
          );
          await this.sleep(delay);
          delay = Math.min(delay * backoffMultiplier, maxDelay);
        }
      }
    }

    throw (
      lastError ||
      new Error(`${adapterName} failed after ${maxRetries} retries`)
    );
  }

  /**
   * Check if circuit is open for an adapter
   */
  private isCircuitOpen(name: string): boolean {
    const state = this.circuitState.get(name);
    if (!state || !state.open) return false;

    // Check if it's time to reset
    if (Date.now() - state.lastFailure > this.circuitResetTime) {
      state.open = false;
      state.failures = 0;
      return false;
    }

    return true;
  }

  /**
   * Record a failure for circuit breaker
   */
  private recordFailure(name: string): void {
    const state = this.circuitState.get(name) || {
      failures: 0,
      lastFailure: 0,
      open: false,
    };

    state.failures++;
    state.lastFailure = Date.now();

    if (state.failures >= this.circuitThreshold) {
      state.open = true;
      console.warn(
        `[WebSearchUseCase] Circuit opened for ${name} after ${state.failures} failures`,
      );
    }

    this.circuitState.set(name, state);
  }

  /**
   * Reset circuit for an adapter
   */
  private resetCircuit(name: string): void {
    this.circuitState.delete(name);
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
