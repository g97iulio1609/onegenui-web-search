/**
 * OneCrawl Search Adapter for @onegenui/web-search
 * Implements WebSearchPort using OneCrawl native TypeScript crawler.
 */

import type {
  WebSearchPort,
  SearchResponse,
  ExtendedSearchOptions,
} from "../ports/search.port";
import { createSearchUseCase, type SearchUseCaseOptions } from "onecrawl";

/**
 * OneCrawlSearchAdapter - WebSearchPort implementation using OneCrawl
 */
export class OneCrawlSearchAdapter implements WebSearchPort {
  private searchUseCase = createSearchUseCase();
  private available: boolean | null = null;

  async search(
    query: string,
    options?: ExtendedSearchOptions
  ): Promise<SearchResponse> {
    const startTime = Date.now();

    const oneCrawlOptions: SearchUseCaseOptions = {
      engine: options?.engine ?? "duckduckgo",
      maxResults: options?.maxResults ?? 10,
      useBrowser: options?.engine === "google" || options?.engine === "bing",
      onProgress: options?.onProgress
        ? (event) => {
            options.onProgress?.({
              phase: event.phase as "starting" | "searching" | "complete" | "error",
              message: event.message,
              results: event.progress,
            });
          }
        : undefined,
      signal: options?.signal,
    };

    const results = await this.searchUseCase.execute(query, oneCrawlOptions);

    return {
      results: {
        query: results.query,
        results: results.results.map((r, i) => ({
          title: r.title,
          url: r.url,
          snippet: r.snippet ?? "",
          position: r.position ?? i + 1,
        })),
        totalResults: results.totalResults,
        searchTime: results.searchTime,
      },
      cached: false,
      duration: Date.now() - startTime,
      source: this.getName(),
    };
  }

  async isAvailable(): Promise<boolean> {
    if (this.available !== null) return this.available;
    this.available = true; // OneCrawl is always available (fetch fallback)
    return this.available;
  }

  getName(): string {
    return "onecrawl";
  }
}

/**
 * Create an OneCrawl search adapter
 */
export function createOneCrawlSearchAdapter(): WebSearchPort {
  return new OneCrawlSearchAdapter();
}
