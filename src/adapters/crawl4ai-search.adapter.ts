// =============================================================================
// @onegenui/web-search - Crawl4AI Search Adapter
// =============================================================================

import type {
  WebSearchPort,
  ExtendedSearchOptions,
  SearchResponse,
} from "../ports/search.port";
import { Crawl4AIService, type Crawl4AIOptions } from "../crawl4ai-service";
import type { SearchOptions, SearchResults } from "../types";

/**
 * LRU Cache for search queries
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class LRUCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;
  private ttl: number;

  constructor(maxSize = 100, ttlMs = 5 * 60 * 1000) {
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
 * Crawl4AISearchAdapter - WebSearchPort implementation using Crawl4AI
 *
 * Features:
 * - Query-level LRU caching with configurable TTL
 * - Progress streaming
 * - Timeout support
 * - Graceful degradation
 */
export class Crawl4AISearchAdapter implements WebSearchPort {
  private service: Crawl4AIService;
  private cache: LRUCache<SearchResults>;
  private available: boolean | null = null;

  constructor(cacheSize = 100, cacheTTL = 5 * 60 * 1000) {
    this.service = new Crawl4AIService();
    this.cache = new LRUCache(cacheSize, cacheTTL);
  }

  async search(
    query: string,
    options: ExtendedSearchOptions = {},
  ): Promise<SearchResponse> {
    const {
      maxResults,
      engine,
      searchType,
      cache: useCache = true,
      timeout = 60000,
      onProgress,
      signal,
    } = options;

    const startTime = Date.now();

    // Check cache first
    const cacheKey = `${query}|${engine || "duckduckgo"}|${searchType || "web"}|${maxResults || 10}`;
    if (useCache) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        onProgress?.({
          phase: "complete",
          message: "Results from cache",
          results: cached.results.length,
        });
        return {
          results: cached,
          cached: true,
          duration: Date.now() - startTime,
          source: this.getName(),
        };
      }
    }

    // Check abort signal
    if (signal?.aborted) {
      throw new Error("Search aborted");
    }

    onProgress?.({ phase: "starting", message: `Searching for "${query}"...` });

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

      // Create search promise with progress forwarding
      const searchPromise = this.service.search(
        query,
        { maxResults, engine, searchType } as SearchOptions,
        onProgress
          ? (action) => {
              onProgress({
                phase:
                  action.status === "complete"
                    ? "complete"
                    : action.status === "error"
                      ? "error"
                      : "searching",
                message: action.message || "",
              });
            }
          : undefined,
      );

      const results = await Promise.race([searchPromise, timeoutPromise]);
      const duration = Date.now() - startTime;

      // Cache the results
      if (useCache && results.results.length > 0) {
        this.cache.set(cacheKey, results);
      }

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
      // Try a simple search to verify the service works
      const result = await this.service.search("test", {
        maxResults: 1,
        engine: "duckduckgo",
      });
      this.available = result.results.length > 0;
    } catch {
      this.available = false;
    }

    return this.available;
  }

  getName(): string {
    return "crawl4ai";
  }

  /**
   * Clear the search cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}
