// =============================================================================
// Browser Service Search Adapter (Fallback)
// =============================================================================

import type {
  WebSearchPort,
  ExtendedSearchOptions,
  SearchResponse,
} from "../ports/search.port";
import { BrowserService, type ActionEmitter } from "../browser-service";
import type { SearchOptions } from "../types";

// Re-export scraper adapter for backward compatibility
export { BrowserServiceScraperAdapter } from "./browser-scraper.adapter";

/** BrowserServiceSearchAdapter — fallback using agent-browser. */
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

    if (signal?.aborted) throw new Error("Search aborted");

    onProgress?.({
      phase: "starting",
      message: `Searching for "${query}" via browser...`,
    });

    try {
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

      const searchPromise = this.service.search(
        query,
        { maxResults, engine } as SearchOptions,
        emit,
      );

      const results = await Promise.race([searchPromise, timeoutPromise]);

      onProgress?.({
        phase: "complete",
        message: `Found ${results.results.length} results`,
        results: results.results.length,
      });

      return {
        results,
        cached: false,
        duration: Date.now() - startTime,
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
      const result = await this.service.search("test", { maxResults: 1 });
      this.available = result.results.length >= 0;
    } catch {
      this.available = false;
    }
    return this.available;
  }

  getName(): string {
    return "browser-service";
  }
}
