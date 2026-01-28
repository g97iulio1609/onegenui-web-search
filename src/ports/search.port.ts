// =============================================================================
// @onegenui/web-search - Search Port (Hexagonal Architecture)
// =============================================================================

import type { SearchResults, SearchOptions } from "../types";

/**
 * Progress callback for search operations
 */
export interface SearchProgress {
  phase: "starting" | "searching" | "parsing" | "complete" | "error";
  message: string;
  progress?: number; // 0-100
  results?: number; // partial result count
}

export type SearchProgressCallback = (progress: SearchProgress) => void;

/**
 * Search options with extended configuration
 */
export interface ExtendedSearchOptions extends SearchOptions {
  /** Timeout in milliseconds */
  timeout?: number;
  /** Enable caching */
  cache?: boolean;
  /** Cache TTL in seconds */
  cacheTTL?: number;
  /** Progress callback */
  onProgress?: SearchProgressCallback;
  /** Abort signal for cancellation */
  signal?: AbortSignal;
}

/**
 * Search result with metadata
 */
export interface SearchResponse {
  results: SearchResults;
  cached: boolean;
  duration: number;
  source: string;
}

/**
 * WebSearchPort - Primary port for web search operations
 *
 * Implementations:
 * - OneCrawlSearchAdapter (primary)
 * - BrowserServiceSearchAdapter (fallback)
 */
export interface WebSearchPort {
  /**
   * Search the web for a query
   */
  search(
    query: string,
    options?: ExtendedSearchOptions,
  ): Promise<SearchResponse>;

  /**
   * Check if the search service is available
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

export const noopWebSearch: WebSearchPort = {
  async search(query: string): Promise<SearchResponse> {
    return {
      results: { query, results: [] },
      cached: false,
      duration: 0,
      source: "noop",
    };
  },

  async isAvailable(): Promise<boolean> {
    return false;
  },

  getName(): string {
    return "noop";
  },
};
